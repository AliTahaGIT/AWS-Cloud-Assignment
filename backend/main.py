from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from db import posts_table, s3, BUCKET
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel
import re
from werkzeug.security import generate_password_hash, check_password_hash #For password hashing.
from fastapi.responses import JSONResponse
from fastapi import status
from db import users_table #importing the users table from the database.
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

#################################### ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) PARTS #########################################
class UpdatePostModel(BaseModel):
    Post_Title: str
    Post_Desc: str




@app.post("/create-post")
async def create_post(
    Post_Title: str = Form(...),
    Post_Organization: str = Form(...),
    Post_Desc: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        file_ext = image.filename.split('.')[-1]
        key = f"posts/{uuid4()}.{file_ext}"

        s3.upload_fileobj(image.file, BUCKET, key, ExtraArgs={"ContentType": image.content_type, "ACL": "public-read"})
        image_url = f"https://{BUCKET}.s3.amazonaws.com/{key}"

        post_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()

        posts_table.put_item(Item={
            "Post_ID": post_id,
            "Post_Title": Post_Title,
            "Post_Organization": Post_Organization,
            "Post_IMG": image_url,
            "Post_S3Key": key,
            "Post_Desc": Post_Desc,
            "Post_CreateDate": timestamp
        })

        return {"message": "Post created", "PostID": post_id, "image_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/posts")
def get_posts():
    try:
        response = posts_table.scan()
        items = response.get("Items", [])

        # Sort items by Post_CreateDate descending (newest first)
        sorted_items = sorted(
            items,
            key=lambda x: datetime.fromisoformat(x["Post_CreateDate"].split(".")[0]),
            reverse=True
        )

        return sorted_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/org-posts")
def get_posts(organization: str = Query(None)):
    try:
        response = posts_table.scan()
        items = response.get("Items", [])

        # If query param provided, filter it
        if organization:
            items = [item for item in items if item.get("Post_Organization") == organization]

        # Sort newest to oldest
        items.sort(key=lambda x: x.get("Post_CreateDate", ""), reverse=True)

        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.put("/update-post/{post_id}")
def update_post(
    post_id: str = Path(...),
    payload: dict = Body(...)
    ):
    try:
        # Validate keys exist
        title = payload.get("Post_Title")
        desc = payload.get("Post_Desc")

        if not title or not desc:
            raise HTTPException(status_code=400, detail="Missing Post_Title or Post_Desc")

        # Update in DynamoDB
        response = posts_table.update_item(
            Key={"Post_ID": post_id},
            UpdateExpression="SET Post_Title = :t, Post_Desc = :d",
            ExpressionAttributeValues={
                ":t": title,
                ":d": desc,
            },
            ReturnValues="UPDATED_NEW"
        )
        return {"message": "Post updated", "updated": response.get("Attributes")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/delete-post/{post_id}")
def delete_post(post_id: str, s3key: str = Query(None)):
    try:
        # Delete from DynamoDB
        posts_table.delete_item(Key={"Post_ID": post_id})

        # Delete image from S3
        if s3key:
            s3.delete_object(Bucket=BUCKET, Key=s3key)

        return {"message": "Post and image deleted successfully."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#####################################################################################################################################

##################################AHMED MOHAMED AHMED ABDELGADIR - TP070007 PART (SIGN UP)##########################
#Registration function to handle user registration
def registration(username: str, password: str, email: str) -> str:
    if not username or not password or not email:
        return "All fields are required."

    if len(password) < 6:
        return "Password must be at least 6 characters long."

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return "Invalid email format."

    # Check if user already exists in DynamoDB
    try:
        response = users_table.get_item(Key={"username": username})
        if 'Item' in response:
            return "Username already exists."
    except Exception as e:
        return f"Error checking existing user: {str(e)}"

    # Hash password
    hashed_password = generate_password_hash(password)

    # Store in DynamoDB
    try:
        users_table.put_item(Item={
            "username": username,
            "email": email,
            "password": hashed_password
        })
        return "Registration successful!"
    except Exception as e:
        return f"Error saving user: {str(e)}"
@app.post("/register")
def register_user(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...)
):
    result = registration(username, password, email)

    if result == "Registration successful!":
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": result})
    else:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": result})
#####################################################################################################################################
#Login function to handle user login
@app.post("/login")
def login_user(
    username: str = Form(...),
    password: str = Form(...)
):
    try:
        # Check if user exists in DynamoDB
        response = users_table.get_item(Key={"username": username})
        user = response.get("Item")

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        # Compare password hash
        if not check_password_hash(user["password"], password):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        # Login successful
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Login successful!"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
######################################################################################################################################