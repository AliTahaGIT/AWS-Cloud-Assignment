"""
Author: ABDUZAFAR MADRAIMOV (TP065584)
"""

from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Query
from app.db import users_table, requests_table, s3, BUCKET
from uuid import uuid4

router = APIRouter()

@router.get("/user-requests")
def get_user_requests(email: str = Query(...)):
    try:
        response = requests_table.scan()
        all_items = response.get("Items", [])

        # Filter by email
        user_items = [item for item in all_items if item.get("user_email") == email]

        return user_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-user-profile")
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
