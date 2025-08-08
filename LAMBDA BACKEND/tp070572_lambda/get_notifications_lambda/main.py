import boto3
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
notifications_table = dynamodb.Table("Notifications")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

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

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)