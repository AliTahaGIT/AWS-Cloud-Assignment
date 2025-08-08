import boto3
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Body, Query
from mangum import Mangum

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
notifications_table = dynamodb.Table("Notifications")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.put("/prod/admin/notifications/{notification_id}")
async def update_flood_notification(
    notification_id: str = Path(...),
    notification_update: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    response = notifications_table.get_item(Key={"notification_id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    if "title" in notification_update:
        update_expression += ", title = :title"
        expression_values[":title"] = notification_update["title"]
    if "message" in notification_update:
        update_expression += ", message = :message"
        expression_values[":message"] = notification_update["message"]
    if "severity" in notification_update:
        update_expression += ", severity = :severity"
        expression_values[":severity"] = notification_update["severity"]
    if "affected_regions" in notification_update:
        update_expression += ", affected_regions = :regions"
        expression_values[":regions"] = notification_update["affected_regions"]
    if "is_active" in notification_update:
        update_expression += ", is_active = :active"
        expression_values[":active"] = notification_update["is_active"]
    
    notifications_table.update_item(
        Key={"notification_id": notification_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    updated_response = notifications_table.get_item(Key={"notification_id": notification_id})
    return {"data": updated_response["Item"]}

@app.delete("/prod/admin/notifications/{notification_id}")
async def delete_flood_notification(
    notification_id: str = Path(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    response = notifications_table.get_item(Key={"notification_id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notifications_table.delete_item(Key={"notification_id": notification_id})
    return {"success": True}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)