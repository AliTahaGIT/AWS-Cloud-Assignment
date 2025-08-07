import boto3
from fastapi import FastAPI, HTTPException, Form
from mangum import Mangum
from werkzeug.security import generate_password_hash
from uuid import uuid4

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

@app.post("/prod/register")
def register_user(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
    role: str = Form(...)
):
    try:
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        if response.get("Items"):
            raise HTTPException(status_code=400, detail="Email already registered.")

        hashed_password = generate_password_hash(password)
        user_id = str(uuid4())

        users_table.put_item(Item={
            "user_id": user_id,
            "email": email,
            "username": username,
            "password": hashed_password,
            "role": role,
            "S3_URL": None,
            "S3_Key": None
        })

        return {"message": "Registration successful!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)