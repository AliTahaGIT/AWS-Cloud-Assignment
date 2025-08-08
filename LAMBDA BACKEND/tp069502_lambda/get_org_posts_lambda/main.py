
import boto3, os
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
posts_table = dynamodb.Table("Posts")


@app.get("/prod/get_org_posts")
def get_posts(organization: str = Query(None)):
    try:
        response = posts_table.scan()
        items = response.get("Items", [])
        if organization:
            items = [item for item in items if item.get("Post_Organization") == organization]
        items.sort(key=lambda x: x.get("Post_CreateDate", ""), reverse=True)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
