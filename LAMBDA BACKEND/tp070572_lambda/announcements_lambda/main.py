import boto3
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Body, Query
from mangum import Mangum
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
announcements_table = dynamodb.Table("Announcements")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.post("/prod/admin/announcements")
async def create_announcement(
    announcement_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    announcement_id = str(uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        "announcement_id": announcement_id,
        "title": announcement_data.get("title"),
        "content": announcement_data.get("content"),
        "is_active": announcement_data.get("is_active", True),
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    announcements_table.put_item(Item=item)
    return {"announcement_id": announcement_id, "data": item}

@app.get("/prod/admin/announcements")
async def get_announcements(
    active_only: bool = Query(True),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    if active_only:
        response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
    else:
        response = announcements_table.scan()
    
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(announcements), "announcements": announcements}

@app.put("/prod/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str = Path(...),
    update_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    response = announcements_table.get_item(Key={"announcement_id": announcement_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    for field in ["title", "content", "is_active"]:
        if field in update_data:
            update_expression += f", {field} = :{field}"
            expression_values[f":{field}"] = update_data[field]
    
    announcements_table.update_item(
        Key={"announcement_id": announcement_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    return {"success": True}

@app.delete("/prod/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str = Path(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    announcements_table.delete_item(Key={"announcement_id": announcement_id})
    return {"success": True}

@app.get("/prod/public/announcements")
async def get_public_announcements():
    response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(announcements), "announcements": announcements}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)