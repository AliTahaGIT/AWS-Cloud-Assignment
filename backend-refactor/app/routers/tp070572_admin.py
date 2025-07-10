# Author: TP070572

import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from werkzeug.security import generate_password_hash, check_password_hash
from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, HTTPException, Query, Path, Body, Depends
from app.db import notifications_table, users_table, requests_table, posts_table, announcements_table
from app.models.schemas import FloodNotificationCreate, FloodNotificationUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])
admin_sessions = {}

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

def generate_secure_key() -> str:
    return secrets.token_urlsafe(32)

def verify_admin(admin_key: str = Query(...)):
    if admin_key not in admin_sessions:
        raise HTTPException(status_code=403, detail="Invalid or expired admin session")
    session = admin_sessions[admin_key]
    if datetime.utcnow() > session['expires']:
        del admin_sessions[admin_key]
        raise HTTPException(status_code=403, detail="Admin session expired")
    return session['admin_id']

@router.post("/notifications")
async def create_flood_notification(notification: FloodNotificationCreate, _: str = Depends(verify_admin)):
    notification_id = str(uuid4())
    timestamp = datetime.utcnow().isoformat()
    item = {
        "notification_id": notification_id,
        "title": notification.title,
        "message": notification.message,
        "severity": notification.severity,
        "affected_regions": notification.affected_regions,
        "is_active": notification.is_active,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    notifications_table.put_item(Item=item)
    return {"notification_id": notification_id, "data": item}

@router.get("/notifications")
async def get_flood_notifications(active_only: bool = Query(False), _: str = Depends(verify_admin)):
    if active_only:
        response = notifications_table.scan(FilterExpression=Attr('is_active').eq(True))
    else:
        response = notifications_table.scan()
    notifications = response.get("Items", [])
    notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(notifications), "notifications": notifications}


@router.put("/notifications/{notification_id}")
async def update_flood_notification(notification_id: str = Path(...), notification_update: FloodNotificationUpdate = Body(...), _: str = Depends(verify_admin)):
    response = notifications_table.get_item(Key={"notification_id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    if notification_update.title is not None:
        update_expression += ", title = :title"
        expression_values[":title"] = notification_update.title
    if notification_update.message is not None:
        update_expression += ", message = :message"
        expression_values[":message"] = notification_update.message
    if notification_update.severity is not None:
        update_expression += ", severity = :severity"
        expression_values[":severity"] = notification_update.severity
    if notification_update.affected_regions is not None:
        update_expression += ", affected_regions = :regions"
        expression_values[":regions"] = notification_update.affected_regions
    if notification_update.is_active is not None:
        update_expression += ", is_active = :active"
        expression_values[":active"] = notification_update.is_active
    
    notifications_table.update_item(
        Key={"notification_id": notification_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    updated_response = notifications_table.get_item(Key={"notification_id": notification_id})
    return {"data": updated_response["Item"]}

@router.delete("/notifications/{notification_id}")
async def delete_flood_notification(notification_id: str = Path(...), _: str = Depends(verify_admin)):
    response = notifications_table.get_item(Key={"notification_id": notification_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Notification not found")
    notifications_table.delete_item(Key={"notification_id": notification_id})
    return {"success": True}


@router.get("/dashboard/stats")
async def get_dashboard_stats(_: str = Depends(verify_admin)):
    stats = {
        'total_users': users_table.scan(Select='COUNT')['Count'],
        'total_posts': posts_table.scan(Select='COUNT')['Count'],
        'total_requests': requests_table.scan(Select='COUNT')['Count'],
        'active_notifications': notifications_table.scan(FilterExpression=Attr('is_active').eq(True), Select='COUNT')['Count']
    }
    return {"dashboard_stats": stats, "last_updated": datetime.utcnow().isoformat()}

@router.get("/public/notifications")
async def get_public_notifications(region: Optional[str] = Query(None), severity: Optional[str] = Query(None)):
    response = notifications_table.scan(FilterExpression=Attr('is_active').eq(True))
    notifications = response.get("Items", [])
    
    if region:
        notifications = [n for n in notifications if region in n.get('affected_regions', [])]
    if severity:
        notifications = [n for n in notifications if n.get('severity') == severity]
    
    severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    notifications.sort(key=lambda x: (severity_order.get(x.get('severity', 'low'), 0), x.get('created_at', '')), reverse=True)
    return {"count": len(notifications), "notifications": notifications}

@router.post("/create-admin-user")
async def create_admin_user(admin_data: dict = Body(...)):
    required_fields = ["username", "email", "password"]
    for field in required_fields:
        if field not in admin_data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")
    
    if len(admin_data["password"]) < 8:
        raise HTTPException(status_code=400, detail="Password too short")
    
    existing_check = users_table.scan(FilterExpression=Attr('username').eq(admin_data["username"]) | Attr('email').eq(admin_data["email"]))
    if existing_check.get("Items"):
        raise HTTPException(status_code=400, detail="User already exists")
    
    admin_id = str(uuid4())
    admin_item = {
        "user_id": admin_id,
        "username": admin_data["username"],
        "email": admin_data["email"],
        "password": hash_password(admin_data["password"]),
        "role": "admin",
        "S3_URL": None,
        "S3_Key": None
    }
    users_table.put_item(Item=admin_item)
    return {"admin_id": admin_id, "username": admin_data["username"]}

@router.post("/admin-login")
async def admin_login(credentials: dict = Body(...)):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    response = users_table.scan(FilterExpression=Attr('username').eq(username) & Attr('role').eq('admin'))
    admin_users = response.get("Items", [])
    
    if not admin_users or not verify_password(password, admin_users[0].get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin_user = admin_users[0]
    session_key = generate_secure_key()
    admin_sessions[session_key] = {
        "admin_id": admin_user["user_id"],
        "username": admin_user["username"],
        "created": datetime.utcnow(),
        "expires": datetime.utcnow() + timedelta(hours=24)
    }
    
    return {
        "admin_id": admin_user["user_id"],
        "admin_key": session_key,
        "username": admin_user["username"]
    }

@router.get("/admin-users")
async def list_admin_users(_: str = Depends(verify_admin)):
    response = users_table.scan(FilterExpression=Attr('role').eq('admin'))
    admin_users = response.get("Items", [])
    for user in admin_users:
        user.pop("password", None)
    return {"count": len(admin_users), "admin_users": admin_users}
@router.get("/users/all")
async def get_all_users(search: Optional[str] = Query(None), role: Optional[str] = Query(None), limit: int = Query(100), _: str = Depends(verify_admin)):
    scan_params = {"Limit": limit}
    if role:
        scan_params["FilterExpression"] = Attr('role').eq(role)
    
    response = users_table.scan(**scan_params)
    users = response.get("Items", [])
    
    if search:
        search_lower = search.lower()
        users = [u for u in users if (search_lower in u.get('full_name', '').lower() or search_lower in u.get('email', '').lower() or search_lower in u.get('username', '').lower())]
    
    for user in users:
        user.pop('password_hash', None)
        user.pop('password', None)
    
    users.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(users), "users": users}


@router.patch("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str = Path(...), password_data: dict = Body(...), _: str = Depends(verify_admin)):
    new_password = password_data.get("new_password")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")
    
    response = users_table.get_item(Key={"user_id": user_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_table.update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET password = :password",
        ExpressionAttributeValues={
            ":password": hash_password(new_password)
        }
    )
    return {"success": True}

@router.put("/users/{user_id}/profile")
async def update_user_profile(user_id: str = Path(...), profile_data: dict = Body(...), _: str = Depends(verify_admin)):
    response = users_table.get_item(Key={"user_id": user_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_expression = "SET "
    expression_values = {}
    first_field = True
    
    for field in ["username", "email"]:
        if field in profile_data:
            if not first_field:
                update_expression += ", "
            update_expression += f"{field} = :{field}"
            expression_values[f":{field}"] = profile_data[field]
            first_field = False
    
    if first_field:
        return {"success": False}
    
    users_table.update_item(
        Key={"user_id": user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    return {"success": True}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str = Path(...), _: str = Depends(verify_admin)):
    response = users_table.get_item(Key={"user_id": user_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    if response["Item"].get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin")
    
    users_table.delete_item(Key={"user_id": user_id})
    return {"success": True}
@router.get("/requests/all")
async def get_all_requests(status: Optional[str] = Query(None), region: Optional[str] = Query(None), search: Optional[str] = Query(None), limit: int = Query(100), _: str = Depends(verify_admin)):
    response = requests_table.scan(Limit=limit)
    requests = response.get("Items", [])
    
    if status:
        requests = [r for r in requests if r.get('status') == status]
    if region:
        requests = [r for r in requests if r.get('req_region', '').lower().find(region.lower()) != -1]
    if search:
        search_lower = search.lower()
        requests = [r for r in requests if (search_lower in r.get('user_name', '').lower() or search_lower in r.get('req_details', '').lower() or search_lower in r.get('req_region', '').lower())]
    
    requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(requests), "requests": requests}

@router.patch("/requests/{request_id}/status")
async def update_request_status(request_id: str = Path(...), status_data: dict = Body(...), _: str = Depends(verify_admin)):
    new_status = status_data.get("status")
    admin_note = status_data.get("admin_note", "")
    
    if new_status not in ["pending", "in_progress", "resolved", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    response = requests_table.get_item(Key={"request_id": request_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_expression = "SET #status = :status, updated_at = :timestamp"
    expression_values = {":status": new_status, ":timestamp": datetime.utcnow().isoformat()}
    expression_names = {"#status": "status"}
    
    if admin_note:
        update_expression += ", admin_note = :note"
        expression_values[":note"] = admin_note
    
    requests_table.update_item(
        Key={"request_id": request_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values,
        ExpressionAttributeNames=expression_names
    )
    return {"success": True, "new_status": new_status}

@router.patch("/requests/{request_id}/assign")
async def assign_request_to_expert(request_id: str = Path(...), assign_data: dict = Body(...), _: str = Depends(verify_admin)):
    expert_id = assign_data.get("expert_id")
    
    expert_response = users_table.get_item(Key={"user_id": expert_id})
    if "Item" not in expert_response or expert_response["Item"].get("role") != "expert":
        raise HTTPException(status_code=400, detail="Invalid expert")
    
    requests_table.update_item(
        Key={"request_id": request_id},
        UpdateExpression="SET assigned_to = :expert_id, assigned_at = :timestamp, #status = :status",
        ExpressionAttributeValues={
            ":expert_id": expert_id,
            ":timestamp": datetime.utcnow().isoformat(),
            ":status": "in_progress"
        },
        ExpressionAttributeNames={"#status": "status"}
    )
    return {"success": True, "assigned_to": expert_id}

@router.post("/requests/{request_id}/notes")
async def add_admin_note_to_request(request_id: str = Path(...), note_data: dict = Body(...), _: str = Depends(verify_admin)):
    note = note_data.get("note")
    if not note:
        raise HTTPException(status_code=400, detail="Note required")
    
    response = requests_table.get_item(Key={"request_id": request_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Request not found")
    
    admin_notes = response["Item"].get("admin_notes", [])
    new_note = {
        "note_id": str(uuid4()),
        "note": note,
        "created_at": datetime.utcnow().isoformat()
    }
    admin_notes.append(new_note)
    
    requests_table.update_item(
        Key={"request_id": request_id},
        UpdateExpression="SET admin_notes = :notes, updated_at = :timestamp",
        ExpressionAttributeValues={
            ":notes": admin_notes,
            ":timestamp": datetime.utcnow().isoformat()
        }
    )
    return {"note": new_note}
@router.post("/announcements")
async def create_announcement(announcement_data: dict = Body(...), _: str = Depends(verify_admin)):
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

@router.get("/announcements")
async def get_announcements(active_only: bool = Query(True), _: str = Depends(verify_admin)):
    filter_expr = Attr('is_active').eq(True) if active_only else None
    response = announcements_table.scan(**({"FilterExpression": filter_expr} if filter_expr else {}))
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(announcements), "announcements": announcements}

@router.put("/announcements/{announcement_id}")
async def update_announcement(announcement_id: str = Path(...), update_data: dict = Body(...), _: str = Depends(verify_admin)):
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

@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str = Path(...), _: str = Depends(verify_admin)):
    announcements_table.delete_item(Key={"announcement_id": announcement_id})
    return {"success": True}

@router.get("/public/announcements")
async def get_public_announcements():
    response = announcements_table.scan(FilterExpression=Attr('is_active').eq(True))
    announcements = response.get("Items", [])
    announcements.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"count": len(announcements), "announcements": announcements}