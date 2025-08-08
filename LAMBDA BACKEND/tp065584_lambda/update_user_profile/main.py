import boto3
from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from mangum import Mangum
from uuid import uuid4

app = FastAPI()
dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")      
s3 = boto3.client("s3")
BUCKET = "cloud60"                         

@app.put("/prod/update_user_profile")
async def update_user_profile(
    user_id: str = Form(...),
    email: str = Form(...),
    fullName: str = Form(...),
    avatar: UploadFile = File(None)
):
    try:
        response = users_table.get_item(Key={"user_id": user_id})
        user = response.get("Item")
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

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

        if avatar:
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

        users_table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )

        updated_response = users_table.get_item(Key={"user_id": user_id})
        updated_user = updated_response.get("Item", {})

        return {
            "message": "Profile updated successfully!",
            "user": {
                "fullName": updated_user.get("username"),
                "email": updated_user.get("email"),
                "avatar_url": updated_user.get("S3_URL")
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)