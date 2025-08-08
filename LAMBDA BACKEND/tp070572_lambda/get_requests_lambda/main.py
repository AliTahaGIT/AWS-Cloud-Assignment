import boto3
import json

from jwt_utils import verify_admin_token
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Requests table if it doesn't exist"""
    table_name = "Requests"
    try:
        dynamodb_client.describe_table(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)

ensure_table_exists()
requests_table = dynamodb.Table("Requests")

@app.get("/prod/admin/requests")
async def get_all_requests(
    status: str = Query(None),
    priority: str = Query(None),
    _: dict = Depends(verify_admin_token)
):
    filter_expression = None
    
    if status and priority:
        filter_expression = Attr('status').eq(status) & Attr('priority').eq(priority)
    elif status:
        filter_expression = Attr('status').eq(status)
    elif priority:
        filter_expression = Attr('priority').eq(priority)
    
    if filter_expression:
        response = requests_table.scan(FilterExpression=filter_expression)
    else:
        response = requests_table.scan()
    
    requests = response.get("Items", [])
    requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(requests), "requests": requests}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)