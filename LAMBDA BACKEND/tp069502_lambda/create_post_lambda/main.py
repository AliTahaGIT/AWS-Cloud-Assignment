
import boto3, os
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from mangum import Mangum
from datetime import datetime
from uuid import uuid4

app = FastAPI()
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

posts_table = dynamodb.Table("Posts")
BUCKET = "cloud60"

@app.post("/prod/create_post")
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

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
