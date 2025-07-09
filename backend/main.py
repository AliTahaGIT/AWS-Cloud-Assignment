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

        requests_table.put_item(Item={
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

# Registration function to handle user registration
def registration(username: str, password: str, email: str, role: str) -> str:
    # Check if email already exists in DynamoDB (email is partition key)
    try:
        response = users_table.get_item(Key={"email": email})
        if 'Item' in response:
            return "Email already registered."
    except Exception as e:
        return f"Error checking existing user: {str(e)}"

    # Hash password
    hashed_password = generate_password_hash(password)

    # Store in DynamoDB with empty S3 fields
    try:
        users_table.put_item(Item={
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


@app.post("/register")
def register_user(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...),
    role: str = Form(...) 
):
    result = registration(username, password, email, role)

    if result == "Registration successful!":
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": result})
    else:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": result})


@app.post("/login")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
    try:
        # Get user by email (email is partition key)
        response = users_table.get_item(Key={"email": email})
        user = response.get("Item")

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

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
                "fullName": user["username"],
                "email": user["email"],
                "s3_url": user["S3_URL"]
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
    email: str = Form(...),
    fullName: str = Form(...),
    avatar: UploadFile = File(None)  # Optional avatar
):
    try:
        # Fetch existing user
        response = users_table.get_item(Key={"email": email})
        user = response.get("Item")
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        update_expr = "SET username = :name"
        expr_values = {":name": fullName}

        new_avatar_url = None

        # If a new avatar is uploaded
        if avatar:
            # DELETE the old S3 avatar (if exists)
            old_key = user.get("S3_Key")
            if old_key:
                s3.delete_object(Bucket=BUCKET, Key=old_key)

            # ✅ Upload new avatar
            file_ext = avatar.filename.split('.')[-1]
            key = f"avatars/{uuid4()}.{file_ext}"
            s3.upload_fileobj(avatar.file, BUCKET, key, ExtraArgs={"ACL": "public-read", "ContentType": avatar.content_type})
            avatar_url = f"https://{BUCKET}.s3.amazonaws.com/{key}"
            new_avatar_url = avatar_url

            update_expr += ", S3_URL = :url, S3_Key = :key"
            expr_values[":url"] = avatar_url
            expr_values[":key"] = key

        # Update in DynamoDB
        users_table.update_item(
            Key={"email": email},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )

        return {
            "message": "Profile updated successfully!",
            "newImageURL": new_avatar_url  # Optional: frontend can update preview/localStorage
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



######################################################################################################################################