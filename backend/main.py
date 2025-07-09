from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from db import posts_table, users_table, requests_table, s3, BUCKET #importing database and AWS configs
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel
from werkzeug.security import generate_password_hash, check_password_hash #For password hashing.
from fastapi.responses import JSONResponse
from fastapi import status
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.post("/submit-request")
def submit_request(
    user_email: str = Form(...),
    user_name: str = Form(...),
    req_type: str = Form(...),
    req_details: str = Form(...),
    req_region: str = Form(...)
):
    try:
        timestamp = datetime.utcnow().isoformat()
        request_id = str(uuid4())

        requests_table.put_item(Item={
            "request_id": request_id,
            "user_email": user_email,
            "user_name": user_name,
            "req_type": req_type,
            "req_details": req_details,
            "req_region": req_region,
            "created_at": timestamp
        })

        return {"message": "Request submitted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#####################################################################################################################################

################################## AHMED MOHAMED AHMED ABDELGADIR - TP070007 PARTS #################################################
@app.post("/register")
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


@app.post("/login")
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



######################################################################################################################################

#################################################### ABDUZAFAR MADRAIMOV (TP065584) PARTS ############################################

@app.get("/user-requests")
def get_user_requests(email: str = Query(...)):
    try:
        response = requests_table.scan()
        all_items = response.get("Items", [])

        # Filter by email
        user_items = [item for item in all_items if item.get("user_email") == email]

        return user_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update-user-profile")
async def update_user_profile(
    user_id: str = Form(...),
    email: str = Form(...),
    fullName: str = Form(...),
    avatar: UploadFile = File(None)
):
    try:
        # Fetch current user by user_id
        response = users_table.get_item(Key={"user_id": user_id})
        user = response.get("Item")
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # If email is changing, check that the new email is not already taken by another user
        if email != user["email"]:
            existing = users_table.scan(
                FilterExpression="email = :email",
                ExpressionAttributeValues={":email": email}
            )
            if existing.get("Items"):
                raise HTTPException(status_code=400, detail="Email already in use by another account.")

        update_expr = "SET username = :name, email = :email"
        expr_values = {
            ":name": fullName,
            ":email": email
        }

        # Handle avatar replacement
        if avatar:
            # Delete old avatar if exists
            old_key = user.get("S3_Key")
            if old_key:
                s3.delete_object(Bucket=BUCKET, Key=old_key)

            file_ext = avatar.filename.split('.')[-1]
            key = f"avatars/{uuid4()}.{file_ext}"
            s3.upload_fileobj(
                avatar.file,
                BUCKET,
                key,
                ExtraArgs={"ACL": "public-read", "ContentType": avatar.content_type}
            )
            avatar_url = f"https://{BUCKET}.s3.amazonaws.com/{key}"

            update_expr += ", S3_URL = :url, S3_Key = :key"
            expr_values[":url"] = avatar_url
            expr_values[":key"] = key

        # Update the user item by user_id
        users_table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )

        return {
            "message": "Profile updated successfully!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




######################################################################################################################################