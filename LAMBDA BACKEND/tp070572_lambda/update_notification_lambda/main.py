import boto3
import json
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

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    affected_regions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    admin_key: str

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.put("/prod/admin/notifications/{notification_id}")
async def update_notification(notification_id: str, notification: NotificationUpdate):
    verify_admin(notification.admin_key)
    
    response = notifications_table.get_item(Key={"id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_expression = "SET updated_at = :updated_at"
    expression_values = {":updated_at": datetime.utcnow().isoformat()}
    
    if notification.title:
        update_expression += ", title = :title"
        expression_values[":title"] = notification.title
    
    if notification.description:
        update_expression += ", description = :description"
        expression_values[":description"] = notification.description
    
    if notification.severity:
        update_expression += ", severity = :severity"
        expression_values[":severity"] = notification.severity
    
    if notification.affected_regions is not None:
        update_expression += ", affected_regions = :regions"
        expression_values[":regions"] = notification.affected_regions
    
    if notification.is_active is not None:
        update_expression += ", is_active = :active"
        expression_values[":active"] = notification.is_active
    
    notifications_table.update_item(
        Key={"id": notification_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    return {"message": "Notification updated", "id": notification_id}

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