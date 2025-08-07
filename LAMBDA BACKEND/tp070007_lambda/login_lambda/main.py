import boto3
from fastapi import FastAPI, HTTPException, Form
from mangum import Mangum
from werkzeug.security import check_password_hash

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")  # Replace with your actual table name

@app.post("/prod/login")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
    try:
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        items = response.get("Items", [])
        if not items:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        user = items[0]

        if not check_password_hash(user["password"], password):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        if user.get("role") != role:
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