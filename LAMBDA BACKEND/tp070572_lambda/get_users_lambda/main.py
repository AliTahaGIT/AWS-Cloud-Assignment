import boto3
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from boto3.dynamodb.conditions import Attr

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/admin/users")
async def get_all_users(
    search: str = Query(None),
    role: str = Query(None),
    limit: int = Query(100),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    scan_params = {"Limit": limit}
    if role:
        scan_params["FilterExpression"] = Attr('role').eq(role)
    
    response = users_table.scan(**scan_params)
    users = response.get("Items", [])
    
    if search:
        search_lower = search.lower()
        users = [
            u for u in users 
            if (search_lower in u.get('full_name', '').lower() or 
                search_lower in u.get('email', '').lower() or 
                search_lower in u.get('username', '').lower())
        ]
    
    for user in users:
        user.pop('password_hash', None)
        user.pop('password', None)
    
    users.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(users), "users": users}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)