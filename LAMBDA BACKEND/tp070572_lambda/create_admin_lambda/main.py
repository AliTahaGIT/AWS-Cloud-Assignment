import boto3
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Body
from mangum import Mangum
from werkzeug.security import generate_password_hash
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

def hash_password(password: str) -> str:
    return generate_password_hash(password)

@app.post("/prod/admin/create")
async def create_admin_user(admin_data: dict = Body(...)):
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
    
    admin_id = str(uuid4())
    admin_item = {
        "user_id": admin_id,
        "username": admin_data["username"],
        "email": admin_data["email"],
        "password": hash_password(admin_data["password"]),
        "role": "admin",
        "S3_URL": None,
        "S3_Key": None
    }
    users_table.put_item(Item=admin_item)
    return {"admin_id": admin_id, "username": admin_data["username"]}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)