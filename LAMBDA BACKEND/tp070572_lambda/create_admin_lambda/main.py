import boto3
import json
import uuid

from jwt_utils import verify_admin_token
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from werkzeug.security import generate_password_hash
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

@app.post("/prod/admin/create")
async def create_admin_user(
    admin_data: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    
    required_fields = ["username", "email", "password"]
    for field in required_fields:
        if field not in admin_data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")
    
    if len(admin_data["password"]) < 8:
        raise HTTPException(status_code=400, detail="Password too short")
    
    existing_check = users_table.scan(
        FilterExpression=Attr('username').eq(admin_data["username"]) | Attr('email').eq(admin_data["email"])
    )
    
    if existing_check.get("Items"):
        raise HTTPException(status_code=400, detail="User already exists")
    
    admin_id = str(uuid.uuid4())
    admin_item = {
        "user_id": admin_id,
        "username": admin_data["username"],
        "email": admin_data["email"],
        "password": generate_password_hash(admin_data["password"]),
        "role": "admin",
        "isAdmin": True,
        "S3_URL": None,
        "S3_Key": None
    }
    users_table.put_item(Item=admin_item)
    return {"admin_id": admin_id, "username": admin_data["username"]}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)