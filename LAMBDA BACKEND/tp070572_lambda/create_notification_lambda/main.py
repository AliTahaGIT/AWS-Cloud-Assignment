import boto3
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body, Query
from mangum import Mangum

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
notifications_table = dynamodb.Table("Notifications")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.post("/prod/admin/notifications/create")
async def create_flood_notification(
    notification: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    notification_id = str(uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
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