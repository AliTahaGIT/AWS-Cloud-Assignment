import boto3
import json
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from pydantic import BaseModel
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Announcements table if it doesn't exist"""
    table_name = "Announcements"
    try:
        dynamodb_client.describe_table(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)

ensure_table_exists()
announcements_table = dynamodb.Table("Announcements")

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"
    is_active: bool = True
    admin_key: str

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/announcements")
async def get_announcements(
    active_only: bool = Query(True)
):
    try:
        if active_only:
            response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
        else:
            response = announcements_table.scan()
        
        announcements = response.get("Items", [])
        announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {"count": len(announcements), "announcements": announcements}
    except Exception as e:
        return {"count": 0, "announcements": [], "error": str(e)}

@app.post("/prod/admin/announcements")
async def create_announcement(announcement: AnnouncementCreate):
    verify_admin(announcement.admin_key)
    
    new_announcement = {
        "id": str(uuid.uuid4()),
        "title": announcement.title,
        "content": announcement.content,
        "priority": announcement.priority,
        "is_active": announcement.is_active,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    announcements_table.put_item(Item=new_announcement)
    
    return {"message": "Announcement created", "announcement": new_announcement}

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    if "requestContext" in event:
        if "http" not in event["requestContext"]:
            event["requestContext"]["http"] = {}
        if "sourceIp" not in event["requestContext"]["http"]:
            event["requestContext"]["http"]["sourceIp"] = "127.0.0.1"
    
    mangum_handler = Mangum(app, lifespan="off")
    response = mangum_handler(event, context)
    
    print(f"Returning response: {json.dumps(response)}")
    
    return response