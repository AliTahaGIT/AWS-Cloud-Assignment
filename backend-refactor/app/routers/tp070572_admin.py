"""
Admin Router - Flood Management System
Author: Amir (TP070572)
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

import bcrypt
from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, HTTPException, Query, Path, Body, Depends
from app.db import notifications_table, contacts_table, users_table, requests_table, posts_table
from app.models.schemas import (
    FloodNotificationCreate,
    FloodNotificationUpdate,
    EmergencyContactCreate,
    EmergencyContactUpdate
)

router = APIRouter(prefix="/admin", tags=["Admin"])

admin_sessions = {}

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

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
async def create_flood_notification(
    notification: FloodNotificationCreate,
    admin_verified: bool = Depends(verify_admin)
):
    try:
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
            "updated_at": timestamp,
            "created_by": "admin"
        }
        
        notifications_table.put_item(Item=item)
        
        
        return {
            "message": "Flood notification created successfully",
            "notification_id": notification_id,
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")

@router.get("/notifications")
async def get_flood_notifications(
    active_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        if active_only:
            response = notifications_table.scan(
                FilterExpression=Attr('is_active').eq(True)
            )
        else:
            response = notifications_table.scan()
        
        notifications = response.get("Items", [])
        
        # Apply additional filters
        if severity:
            notifications = [n for n in notifications if n.get('severity') == severity]
        
        if region:
            notifications = [n for n in notifications if region in n.get('affected_regions', [])]
        
        # Sort by creation date (newest first)
        notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            "count": len(notifications),
            "notifications": notifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.get("/notifications/{notification_id}")
async def get_flood_notification(
    notification_id: str = Path(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Get a specific flood notification by ID"""
    try:
        response = notifications_table.get_item(
            Key={"notification_id": notification_id}
        )
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return response["Item"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notification: {str(e)}")

@router.put("/notifications/{notification_id}")
async def update_flood_notification(
    notification_id: str = Path(...),
    notification_update: FloodNotificationUpdate = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Update a flood notification"""
    try:
        # Check if notification exists
        response = notifications_table.get_item(
            Key={"notification_id": notification_id}
        )
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Build update expression
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
        
        # Update the item
        notifications_table.update_item(
            Key={"notification_id": notification_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Return updated item
        updated_response = notifications_table.get_item(
            Key={"notification_id": notification_id}
        )
        
        return {
            "message": "Notification updated successfully",
            "data": updated_response["Item"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification: {str(e)}")

@router.delete("/notifications/{notification_id}")
async def delete_flood_notification(
    notification_id: str = Path(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Delete a flood notification"""
    try:
        # Check if notification exists
        response = notifications_table.get_item(
            Key={"notification_id": notification_id}
        )
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Delete the notification
        notifications_table.delete_item(
            Key={"notification_id": notification_id}
        )
        
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")


@router.post("/emergency-contacts")
async def create_emergency_contact(
    contact: EmergencyContactCreate,
    admin_verified: bool = Depends(verify_admin)
):
    try:
        contact_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            "contact_id": contact_id,
            "name": contact.name,
            "role": contact.role,
            "phone": contact.phone,
            "email": contact.email,
            "region": contact.region,
            "is_active": contact.is_active,
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        contacts_table.put_item(Item=item)
        
        return {
            "message": "Emergency contact created successfully",
            "contact_id": contact_id,
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating contact: {str(e)}")

@router.get("/emergency-contacts")
async def get_emergency_contacts(
    region: Optional[str] = Query(None),
    active_only: bool = Query(True),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        if active_only:
            response = contacts_table.scan(
                FilterExpression=Attr('is_active').eq(True)
            )
        else:
            response = contacts_table.scan()
        
        contacts = response.get("Items", [])
        
        if region:
            contacts = [c for c in contacts if c.get('region') == region]
        
        return {
            "count": len(contacts),
            "contacts": contacts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")

@router.put("/emergency-contacts/{contact_id}")
async def update_emergency_contact(
    contact_id: str = Path(...),
    contact_update: EmergencyContactUpdate = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        # Check if contact exists
        response = contacts_table.get_item(Key={"contact_id": contact_id})
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Build update expression
        update_expression = "SET updated_at = :timestamp"
        expression_values = {":timestamp": datetime.utcnow().isoformat()}
        
        for field, value in contact_update.dict(exclude_none=True).items():
            update_expression += f", {field} = :{field}"
            expression_values[f":{field}"] = value
        
        contacts_table.update_item(
            Key={"contact_id": contact_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        updated_response = contacts_table.get_item(Key={"contact_id": contact_id})
        
        return {
            "message": "Contact updated successfully",
            "data": updated_response["Item"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")

@router.delete("/emergency-contacts/{contact_id}")
async def delete_emergency_contact(
    contact_id: str = Path(...),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        response = contacts_table.get_item(Key={"contact_id": contact_id})
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        contacts_table.delete_item(Key={"contact_id": contact_id})
        
        return {"message": "Contact deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")


@router.get("/dashboard/stats")
async def get_dashboard_stats(admin_verified: bool = Depends(verify_admin)):
    try:
        stats = {}
        
        # Count total users
        users_response = users_table.scan(Select='COUNT')
        stats['total_users'] = users_response['Count']
        
        # Count total posts
        posts_response = posts_table.scan(Select='COUNT')
        stats['total_posts'] = posts_response['Count']
        
        # Count total requests
        requests_response = requests_table.scan(Select='COUNT')
        stats['total_requests'] = requests_response['Count']
        
        # Count active notifications
        notifications_response = notifications_table.scan(
            FilterExpression=Attr('is_active').eq(True),
            Select='COUNT'
        )
        stats['active_notifications'] = notifications_response['Count']
        
        # Count emergency contacts
        contacts_response = contacts_table.scan(Select='COUNT')
        stats['emergency_contacts'] = contacts_response['Count']
        
        return {
            "dashboard_stats": stats,
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@router.get("/users")
async def get_users_overview(
    limit: int = Query(50),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        response = users_table.scan(Limit=limit)
        users = response.get("Items", [])
        
        safe_users = []
        for user in users:
            safe_user = {
                "user_id": user.get("user_id", ""),
                "full_name": user.get("full_name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", ""),
                "created_at": user.get("created_at", "")
            }
            safe_users.append(safe_user)
        
        return {
            "count": len(safe_users),
            "users": safe_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.get("/requests/overview")
async def get_requests_overview(
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    limit: int = Query(50),
    admin_verified: bool = Depends(verify_admin)
):
    try:
        response = requests_table.scan(Limit=limit)
        requests = response.get("Items", [])
        
        if status:
            requests = [r for r in requests if r.get('status') == status]
        
        if region:
            requests = [r for r in requests if r.get('region') == region]
        
        return {
            "count": len(requests),
            "requests": requests
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")


@router.get("/public/notifications")
async def get_public_notifications(
    region: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    try:
        response = notifications_table.scan(
            FilterExpression=Attr('is_active').eq(True)
        )
        
        notifications = response.get("Items", [])
        
        if region:
            notifications = [n for n in notifications if region in n.get('affected_regions', [])]
        
        if severity:
            notifications = [n for n in notifications if n.get('severity') == severity]
        
        severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        notifications.sort(
            key=lambda x: (
                severity_order.get(x.get('severity', 'low'), 0),
                x.get('created_at', '')
            ),
            reverse=True
        )
        
        return {
            "count": len(notifications),
            "notifications": notifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.get("/public/emergency-contacts")
async def get_public_emergency_contacts(region: Optional[str] = Query(None)):
    try:
        response = contacts_table.scan(
            FilterExpression=Attr('is_active').eq(True)
        )
        
        contacts = response.get("Items", [])
        
        if region:
            contacts = [c for c in contacts if c.get('region') == region]
        
        return {
            "count": len(contacts),
            "contacts": contacts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")

@router.post("/create-admin-user")
async def create_admin_user(admin_data: dict = Body(...)):
    try:
        required_fields = ["username", "email", "full_name", "password"]
        for field in required_fields:
            if field not in admin_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        password = admin_data["password"]
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        admin_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        hashed_password = hash_password(password)
        
        admin_item = {
            "user_id": admin_id,
            "username": admin_data["username"],
            "email": admin_data["email"],
            "full_name": admin_data["full_name"],
            "password_hash": hashed_password,
            "role": "admin",
            "is_active": True,
            "created_at": timestamp,
            "updated_at": timestamp,
            "permissions": ["notifications", "contacts", "users", "dashboard"]
        }
        
        existing_check = users_table.scan(
            FilterExpression=Attr('username').eq(admin_data["username"]) | 
                           Attr('email').eq(admin_data["email"])
        )
        
        if existing_check.get("Items"):
            raise HTTPException(status_code=400, detail="Admin user with this username or email already exists")
        
        users_table.put_item(Item=admin_item)
        
        response_data = admin_item.copy()
        del response_data["password_hash"]
        
        return {
            "message": "Admin user created successfully",
            "admin_id": admin_id,
            "data": response_data,
            "login_url": "/admin-login"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating admin user: {str(e)}")

@router.post("/admin-login")
async def admin_login(
    credentials: dict = Body(...)
):
    try:
        username = credentials.get("username")
        password = credentials.get("password")
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        response = users_table.scan(
            FilterExpression=Attr('username').eq(username) & 
                           Attr('role').eq('admin') &
                           Attr('is_active').eq(True)
        )
        
        admin_users = response.get("Items", [])
        
        if not admin_users:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        admin_user = admin_users[0]
        
        if not verify_password(password, admin_user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        session_key = generate_secure_key()
        
        admin_sessions[session_key] = {
            "admin_id": admin_user["user_id"],
            "username": admin_user["username"],
            "full_name": admin_user["full_name"],
            "permissions": admin_user.get("permissions", []),
            "created": datetime.utcnow(),
            "expires": datetime.utcnow() + timedelta(hours=24)
        }
        
        return {
            "message": "Admin login successful",
            "admin_id": admin_user["user_id"],
            "admin_key": session_key,
            "permissions": admin_user.get("permissions", []),
            "full_name": admin_user.get("full_name"),
            "session_expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during admin login: {str(e)}")

@router.get("/admin-users")
async def list_admin_users(admin_verified: bool = Depends(verify_admin)):
    try:
        response = users_table.scan(
            FilterExpression=Attr('role').eq('admin')
        )
        
        admin_users = response.get("Items", [])
        
        for user in admin_users:
            if "password_hash" in user:
                del user["password_hash"]
        
        return {
            "count": len(admin_users),
            "admin_users": admin_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin users: {str(e)}")