
import boto3, os
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from mangum import Mangum
from datetime import datetime
from uuid import uuid4

app = FastAPI()
dynamodb = boto3.resource("dynamodb")
posts_table = dynamodb.Table("Posts")


@app.get("/org-posts")
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

# Custom handler to log the raw event
def handler(event, context):
    print(f"Raw event: {json.dumps(event)}")
    print(f"Path from event: {event.get('path', 'No path')}")
    print(f"RawPath from event: {event.get('rawPath', 'No rawPath')}")
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
