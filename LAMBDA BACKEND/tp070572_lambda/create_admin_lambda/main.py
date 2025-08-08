import boto3
import json
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel
from werkzeug.security import generate_password_hash
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Users table if it doesn't exist or add default admin"""
    table_name = "Users"
    try:
        dynamodb_client.describe_table(TableName=table_name)
        users_table = dynamodb.Table(table_name)
        
        # Check if admin user exists
        response = users_table.scan(
            FilterExpression=Attr('username').eq('admin')
        )
        
        if not response.get("Items"):
            # Create default admin user
            users_table.put_item(Item={
                "user_id": str(uuid.uuid4()),
                "username": "admin",
                "password": generate_password_hash("admin123"),
                "email": "admin@cloud60.com",
                "full_name": "System Administrator",
                "isAdmin": True,
                "role": "admin",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })
            print("Created default admin user (username: admin, password: admin123)")
            
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Creating table {table_name}")
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "user_id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            
            # Create default admin user
            users_table = dynamodb.Table(table_name)
            users_table.put_item(Item={
                "user_id": str(uuid.uuid4()),
                "username": "admin",
                "password": generate_password_hash("admin123"),
                "email": "admin@cloud60.com",
                "full_name": "System Administrator",
                "isAdmin": True,
                "role": "admin",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })
            print("Created default admin user (username: admin, password: admin123)")

ensure_table_exists()
users_table = dynamodb.Table("Users")

class AdminCreate(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
    master_admin_key: str

def verify_master_admin(key: str):
    # In production, verify against a secure master key
    if key != "MASTER_ADMIN_KEY_2024":
        raise HTTPException(status_code=403, detail="Invalid master admin key")
    return True

@app.post("/prod/admin/create")
async def create_admin_user(admin_data: AdminCreate):
    verify_master_admin(admin_data.master_admin_key)
    
    # Check if username already exists
    response = users_table.scan(
        FilterExpression=Attr('username').eq(admin_data.username)
    )
    
    if response.get("Items"):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new admin user
    new_admin = {
        "user_id": str(uuid.uuid4()),
        "username": admin_data.username,
        "password": generate_password_hash(admin_data.password),
        "email": admin_data.email,
        "full_name": admin_data.full_name,
        "isAdmin": True,
        "role": "admin",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    users_table.put_item(Item=new_admin)
    
    # Don't return password hash
    new_admin.pop("password")
    
    return {"message": "Admin user created successfully", "admin": new_admin}

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