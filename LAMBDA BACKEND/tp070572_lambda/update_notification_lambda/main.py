import boto3
import json

from jwt_utils import verify_admin_token
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from typing import List, Optional
from botocore.exceptions import ClientError

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.put("/prod/admin/notifications/{notification_id}")
async def update_notification(
    notification_id: str = Path(...),
    update_data: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    response = notifications_table.get_item(Key={"notification_id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    for field in ["title", "message", "severity", "affected_regions", "is_active"]:
        if field in update_data:
            update_expression += f", {field} = :{field}"
            expression_values[f":{field}"] = update_data[field]
    
    notifications_table.update_item(
        Key={"notification_id": notification_id},
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