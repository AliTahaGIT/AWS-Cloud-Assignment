import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from werkzeug.security import generate_password_hash
from uuid import uuid4
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    role: str

@app.post("/prod/register")
def register_user(request: RegisterRequest):
    try:
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": request.email}
        )
        if response.get("Items"):
            raise HTTPException(status_code=400, detail="Email already registered.")

        hashed_password = generate_password_hash(request.password)
        user_id = str(uuid4())

        users_table.put_item(Item={
            "user_id": user_id,
            "email": request.email,
            "username": request.username,
            "password": hashed_password,
            "role": request.role,
            "S3_URL": None,
            "S3_Key": None
        })

        return {"message": "Registration successful!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)