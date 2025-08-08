import boto3
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")
posts_table = dynamodb.Table("Posts")
requests_table = dynamodb.Table("Requests")
notifications_table = dynamodb.Table("Notifications")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/admin/dashboard/stats")
async def get_dashboard_stats(admin_key: str = Query(...)):
    verify_admin(admin_key)
    
    stats = {
        'total_users': users_table.scan(Select='COUNT')['Count'],
        'total_posts': posts_table.scan(Select='COUNT')['Count'],
        'total_requests': requests_table.scan(Select='COUNT')['Count'],
        'active_notifications': notifications_table.scan(
            FilterExpression=Attr('is_active').eq(True), 
            Select='COUNT'
        )['Count']
    }
    
    return {
        "dashboard_stats": stats, 
        "last_updated": datetime.utcnow().isoformat()
    }

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)