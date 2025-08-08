
import boto3
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from datetime import datetime
from uuid import uuid4

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

posts_table = dynamodb.Table("Posts")
BUCKET = "cloud60"

@app.delete("/prod/delete_post/{post_id}")
def delete_post(post_id: str, s3key: str = Query(None)):
    try:
        posts_table.delete_item(Key={"Post_ID": post_id})
        if s3key:
            s3.delete_object(Bucket=BUCKET, Key=s3key)
        return {"message": "Post and image deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
