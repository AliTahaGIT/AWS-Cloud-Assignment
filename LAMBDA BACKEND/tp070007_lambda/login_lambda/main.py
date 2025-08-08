import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from werkzeug.security import check_password_hash
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

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

@app.post("/prod/login")
def login_user(request: LoginRequest):
    try:
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": request.email}
        )
        items = response.get("Items", [])
        if not items:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        user = items[0]

        if not check_password_hash(user["password"], request.password):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        if user.get("role") != request.role:
            raise HTTPException(status_code=401, detail="Invalid role.")

        return {
            "message": "Login successful!",
            "user_id": user["user_id"],
            "fullName": user["username"],
            "email": user["email"],
            "s3_url": user.get("S3_URL")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)