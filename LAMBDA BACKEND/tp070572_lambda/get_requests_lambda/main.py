import boto3
import json
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from botocore.exceptions import ClientError

app = FastAPI()

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

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/admin/requests")
async def get_all_requests(
    status: str = Query(None),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    if status:
        from boto3.dynamodb.conditions import Attr
        response = requests_table.scan(FilterExpression=Attr('status').eq(status))
    else:
        response = requests_table.scan()
    
    requests = response.get("Items", [])
    requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(requests), "requests": requests}

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    if "requestContext" in event:
        if "http" not in event["requestContext"]:
            event["requestContext"]["http"] = {}
        if "sourceIp" not in event["requestContext"]["http"]:
            event["requestContext"]["http"]["sourceIp"] = "127.0.0.1"
    
    mangum_handler = Mangum(app, lifespan="off")
    response = mangum_handler(event, context)
    
    print(f"Returning response: {json.dumps(response)}")
    
    return response