import boto3
import json
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Check if Users table exists"""
    table_name = "Users"
    try:
        dynamodb_client.describe_table(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table {table_name} does not exist")
            # Don't create it here - let registration endpoint handle it

ensure_table_exists()
users_table = dynamodb.Table("Users")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/admin/users")
async def get_all_users(admin_key: str = Query(...)):
    verify_admin(admin_key)
    
    try:
        response = users_table.scan()
        users = response.get("Items", [])
        
        # Remove passwords from response
        for user in users:
            user.pop("password", None)
        
        return {"count": len(users), "users": users}
    except Exception as e:
        return {"count": 0, "users": [], "error": str(e)}

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