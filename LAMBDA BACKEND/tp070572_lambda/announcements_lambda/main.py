import boto3
import json
import uuid

from jwt_utils import verify_admin_token
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Path, Body, Depends
from mangum import Mangum
from typing import Optional
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

@app.get("/prod/public/announcements")
async def get_public_announcements():
    response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(announcements), "announcements": announcements}

@app.get("/prod/admin/announcements")
async def get_announcements(
    active_only: bool = Query(True),
    _: dict = Depends(verify_admin_token)
):
    if active_only:
        response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
    else:
        response = announcements_table.scan()
    
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(announcements), "announcements": announcements}

@app.post("/prod/admin/announcements")
async def create_announcement(
    announcement_data: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    announcement_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        "id": announcement_id,
        "announcement_id": announcement_id,
        "title": announcement_data.get("title"),
        "content": announcement_data.get("content"),
        "is_active": announcement_data.get("is_active", True),
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    announcements_table.put_item(Item=item)
    return {"announcement_id": announcement_id, "data": item}

@app.put("/prod/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str = Path(...),
    update_data: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    response = announcements_table.get_item(Key={"id": announcement_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    for field in ["title", "content", "is_active"]:
        if field in update_data:
            update_expression += f", {field} = :{field}"
            expression_values[f":{field}"] = update_data[field]
    
    announcements_table.update_item(
        Key={"id": announcement_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    return {"success": True}

@app.delete("/prod/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str = Path(...),
    _: dict = Depends(verify_admin_token)
):
    announcements_table.delete_item(Key={"id": announcement_id})
    return {"success": True}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)