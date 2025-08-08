import boto3
import json
import uuid

from jwt_utils import verify_admin_token
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body, Depends
from mangum import Mangum
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

@app.post("/prod/admin/notifications")
async def create_flood_notification(
    notification: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    
    notification_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        "id": notification_id,
        "notification_id": notification_id,
        "title": notification.get("title"),
        "message": notification.get("message"),
        "severity": notification.get("severity"),
        "affected_regions": notification.get("affected_regions", []),
        "is_active": notification.get("is_active", True),
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    notifications_table.put_item(Item=item)
    return {"notification_id": notification_id, "data": item}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)