"""
Author: AHMED MOHAMED AHMED ABDELGADIR (TP070007)
"""

from fastapi import APIRouter, Form, HTTPException, status
from fastapi.responses import JSONResponse
from app.db import users_table
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4

router = APIRouter()

# Registration function to handle user registration
def registration(username: str, password: str, email: str, role: str) -> str:
    # Scan to check if email already exists
    try:
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        if response.get("Items"):
            return "Email already registered."
    except Exception as e:
        return f"Error checking existing user: {str(e)}"

    # Hash password
    hashed_password = generate_password_hash(password)
    user_id = str(uuid4())

    # Store in DynamoDB with user_id as primary key
    try:
        users_table.put_item(Item={
            "user_id": user_id,
            "email": email,
            "username": username,
            "password": hashed_password,
            "role": role,
            "S3_URL": None,
            "S3_Key": None
        })
        return "Registration successful!"
    except Exception as e:
        return f"Error saving user: {str(e)}"


@router.post("/register")
def register_user(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
    role: str = Form(...)
):
    try:
        # Scan to check if email already exists
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        if response.get("Items"):
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": "Email already registered."})

        # Hash the password
        hashed_password = generate_password_hash(password)
        user_id = str(uuid4())

        # Insert new user
        users_table.put_item(Item={
            "user_id": user_id,
            "email": email,
            "username": username,
            "password": hashed_password,
            "role": role,
            "S3_URL": None,
            "S3_Key": None
        })

        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Registration successful!"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
    try:
        # Scan to find user by email
        response = users_table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        items = response.get("Items", [])
        if not items:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        user = items[0]

        # Check password
        if not check_password_hash(user["password"], password):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        # Check role match
        if user.get("role") != role:
            raise HTTPException(status_code=401, detail="Invalid role.")

        # Success
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Login successful!",
                "user_id": user["user_id"],
                "fullName": user["username"],
                "email": user["email"],
                "s3_url": user.get("S3_URL")
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
