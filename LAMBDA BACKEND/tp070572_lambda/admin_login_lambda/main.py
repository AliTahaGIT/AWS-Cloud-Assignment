import boto3
import json
import secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Body
from mangum import Mangum
from werkzeug.security import check_password_hash
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

admin_sessions = {}

def generate_secure_key() -> str:
    return secrets.token_urlsafe(32)

def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

@app.post("/prod/admin/login")
async def admin_login(credentials: dict = Body(...)):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    response = users_table.scan(
        FilterExpression=Attr('username').eq(username) & Attr('role').eq('admin')
    )
    admin_users = response.get("Items", [])
    
    if not admin_users or not verify_password(password, admin_users[0].get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin_user = admin_users[0]
    session_key = generate_secure_key()
    
    session_data = {
        "admin_id": admin_user["user_id"],
        "username": admin_user["username"],
        "created": datetime.utcnow().isoformat(),
        "expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }
    
    admin_sessions[session_key] = session_data
    
    return {
        "admin_id": admin_user["user_id"],
        "admin_key": session_key,
        "username": admin_user["username"],
        "session": session_data
    }

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)