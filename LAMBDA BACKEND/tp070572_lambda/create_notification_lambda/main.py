import boto3
import json
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel
from typing import List, Optional
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Notifications table if it doesn't exist"""
    table_name = "Notifications"
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
notifications_table = dynamodb.Table("Notifications")

class NotificationCreate(BaseModel):
    title: str
    description: str
    severity: str
    affected_regions: List[str]
    is_active: bool = True
    admin_key: str

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.post("/prod/admin/notifications")
async def create_notification(notification: NotificationCreate):
    verify_admin(notification.admin_key)
    
    new_notification = {
        "id": str(uuid.uuid4()),
        "title": notification.title,
        "description": notification.description,
        "severity": notification.severity,
        "affected_regions": notification.affected_regions,
        "is_active": notification.is_active,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    notifications_table.put_item(Item=new_notification)
    
    return {"message": "Notification created", "notification": new_notification}

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