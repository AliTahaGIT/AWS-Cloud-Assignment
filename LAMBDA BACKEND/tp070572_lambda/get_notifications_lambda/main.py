import boto3
import json
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Notifications table if it doesn't exist"""
    table_name = "Notifications"
    try:
        dynamodb_client.describe_table(TableName=table_name)
        print(f"Table {table_name} exists")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Creating table {table_name}")
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            # Wait for table to be created
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            print(f"Table {table_name} created successfully")

# Ensure table exists on Lambda cold start
ensure_table_exists()
notifications_table = dynamodb.Table("Notifications")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

# Routes with /prod prefix for API Gateway
@app.get("/prod/test_notifications")
async def test_route():
    return {"message": "Test route works!", "path": "/prod/test_notifications"}

@app.get("/prod/notifications")
async def get_notifications_simple():
    try:
        response = notifications_table.scan(FilterExpression=Attr('is_active').eq(True))
        notifications = response.get("Items", [])
        return {"count": len(notifications), "notifications": notifications}
    except Exception as e:
        return {"count": 0, "notifications": [], "error": str(e)}

@app.get("/prod/admin/notifications")
async def get_flood_notifications(
    active_only: bool = Query(False),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    if active_only:
        response = notifications_table.scan(FilterExpression=Attr('is_active').eq(True))
    else:
        response = notifications_table.scan()
    
    notifications = response.get("Items", [])
    notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(notifications), "notifications": notifications}

@app.get("/prod/public/notifications")
async def get_public_notifications(
    region: str = Query(None),
    severity: str = Query(None)
):
    try:
        response = notifications_table.scan(FilterExpression=Attr('is_active').eq(True))
        notifications = response.get("Items", [])
        
        if region:
            notifications = [n for n in notifications if region in n.get('affected_regions', [])]
        if severity:
            notifications = [n for n in notifications if n.get('severity') == severity]
        
        severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        notifications.sort(
            key=lambda x: (severity_order.get(x.get('severity', 'low'), 0), x.get('created_at', '')), 
            reverse=True
        )
        
        return {"count": len(notifications), "notifications": notifications}
    except Exception as e:
        return {"count": 0, "notifications": [], "error": str(e)}

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Fix missing fields in event
    if "requestContext" in event:
        if "http" not in event["requestContext"]:
            event["requestContext"]["http"] = {}
        if "sourceIp" not in event["requestContext"]["http"]:
            event["requestContext"]["http"]["sourceIp"] = "127.0.0.1"
    
    # Create Mangum handler
    mangum_handler = Mangum(app, lifespan="off")
    
    # Call the handler
    response = mangum_handler(event, context)
    
    print(f"Returning response: {json.dumps(response)}")
    
    return response