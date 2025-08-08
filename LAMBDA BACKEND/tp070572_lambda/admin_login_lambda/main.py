import boto3
import json
import jwt
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Body
from mangum import Mangum
from werkzeug.security import check_password_hash
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

app = FastAPI()

# JWT configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Check if Users table exists"""
    table_name = "Users"
    try:
        dynamodb_client.describe_table(TableName=table_name)
        print(f"Table {table_name} exists")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table {table_name} does not exist - will be created by registration endpoint")
            return False
    return True

if ensure_table_exists():
    users_table = dynamodb.Table("Users")
else:
    users_table = dynamodb.Table("Users")

def verify_password(password: str, hashed: str) -> bool:
    try:
        return check_password_hash(hashed, password)
    except:
        # Fallback for unhashed passwords (development only)
        return password == hashed

def create_jwt_token(user_data: dict) -> str:
    """Create a JWT token for the authenticated admin"""
    payload = {
        "user_id": user_data["user_id"],
        "username": user_data["username"],
        "role": user_data.get("role", "admin"),
        "isAdmin": user_data.get("isAdmin", True),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@app.post("/prod/admin/login")
async def admin_login(credentials: dict = Body(...)):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Query for admin user
    response = users_table.scan(
        FilterExpression=Attr('username').eq(username)
    )
    
    users = response.get("Items", [])
    
    if not users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users[0]
    
    # Check if user is admin (either by role or isAdmin flag)
    is_admin = user.get("role") == "admin" or user.get("isAdmin", False)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Access denied - admin privileges required")
    
    # Verify password
    if not verify_password(password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_jwt_token(user)
    
    # Return authentication response
    return {
        "success": True,
        "user_id": user["user_id"],
        "username": user["username"],
        "token": token,
        "expires_in": JWT_EXPIRATION_HOURS * 3600,
        "token_type": "Bearer"
    }

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)