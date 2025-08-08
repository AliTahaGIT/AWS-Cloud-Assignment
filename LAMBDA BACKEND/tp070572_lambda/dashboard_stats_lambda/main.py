import boto3
import json

from jwt_utils import verify_admin_token
from fastapi import FastAPI, HTTPException, Depends
from mangum import Mangum
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_tables_exist():
    """Create all required tables if they don't exist"""
    tables_config = {
        "Users": {
            "KeySchema": [{"AttributeName": "username", "KeyType": "HASH"}],
            "AttributeDefinitions": [{"AttributeName": "username", "AttributeType": "S"}]
        },
        "Requests": {
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}]
        },
        "Notifications": {
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}]
        },
        "Announcements": {
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}]
        },
        "Posts": {
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}]
        }
    }
    
    for table_name, config in tables_config.items():
        try:
            dynamodb_client.describe_table(TableName=table_name)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"Creating table {table_name}")
                dynamodb_client.create_table(
                    TableName=table_name,
                    KeySchema=config["KeySchema"],
                    AttributeDefinitions=config["AttributeDefinitions"],
                    BillingMode="PAY_PER_REQUEST"
                )

ensure_tables_exist()

@app.get("/prod/admin/dashboard/stats")
async def get_dashboard_stats(_: dict = Depends(verify_admin_token)):
    
    stats = {}
    
    try:
        # Get user stats
        users_table = dynamodb.Table("Users")
        users_response = users_table.scan()
        users = users_response.get("Items", [])
        stats["total_users"] = len(users)
        stats["admin_users"] = len([u for u in users if u.get("isAdmin", False)])
        
        # Get request stats
        requests_table = dynamodb.Table("Requests")
        requests_response = requests_table.scan()
        requests = requests_response.get("Items", [])
        stats["total_requests"] = len(requests)
        stats["pending_requests"] = len([r for r in requests if r.get("status") == "pending"])
        stats["resolved_requests"] = len([r for r in requests if r.get("status") == "resolved"])
        
        # Get notification stats
        notifications_table = dynamodb.Table("Notifications")
        notif_response = notifications_table.scan()
        notifications = notif_response.get("Items", [])
        stats["total_notifications"] = len(notifications)
        stats["active_notifications"] = len([n for n in notifications if n.get("is_active", False)])
        
        # Get recent activity (last 7 days)
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        recent_requests = [r for r in requests if r.get("created_at", "") > week_ago]
        stats["requests_last_week"] = len(recent_requests)
        
        # Get announcements stats
        try:
            announcements_table = dynamodb.Table("Announcements")
            announce_response = announcements_table.scan()
            announcements = announce_response.get("Items", [])
            stats["total_announcements"] = len(announcements)
            stats["active_announcements"] = len([a for a in announcements if a.get("is_active", False)])
        except:
            stats["total_announcements"] = 0
            stats["active_announcements"] = 0
        
        # Get posts stats
        try:
            posts_table = dynamodb.Table("Posts")
            posts_response = posts_table.scan()
            posts = posts_response.get("Items", [])
            stats["total_posts"] = len(posts)
        except:
            stats["total_posts"] = 0
        
        return {
            "stats": stats,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "stats": stats,
            "generated_at": datetime.utcnow().isoformat()
        }

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)