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
    table_name = "Users"
    try:
        dynamodb_client.describe_table(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table {table_name} does not exist")

ensure_table_exists()
users_table = dynamodb.Table("Users")

@app.get("/prod/admin/users")
async def get_all_users(
    role: str = Query(None),
    _: dict = Depends(verify_admin_token)
):
    
    try:
        if role:
            response = users_table.scan(FilterExpression=Attr('role').eq(role))
        else:
            response = users_table.scan()
        
        users = response.get("Items", [])
        
        for user in users:
            user.pop("password", None)
        
        return {"count": len(users), "users": users}
    except Exception as e:
        return {"count": 0, "users": [], "error": str(e)}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)