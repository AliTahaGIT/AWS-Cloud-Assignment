# Admin Router - Flood Management System  
# Author: TP070572

import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from werkzeug.security import generate_password_hash, check_password_hash
from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, HTTPException, Query, Path, Body, Depends
from app.db import notifications_table, users_table, requests_table, posts_table, dynamodb
from app.models.schemas import (
    FloodNotificationCreate,
    FloodNotificationUpdate
)

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
            "message": "Notification created",
            "notification_id": notification_id,
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")

@router.get("/notifications")
async def get_flood_notifications(
    active_only: bool = Query(False),
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
        
        # Sort by creation date (newest first)
        notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            "count": len(notifications),
            "notifications": notifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")


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
            "message": "Notification updated",
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
        
        return {"message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")


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
        
        return {
            "dashboard_stats": stats,
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")




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

@router.post("/create-admin-user")
async def create_admin_user(admin_data: dict = Body(...)):
    try:
        required_fields = ["username", "email", "password"]
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
            "password": hashed_password,
            "role": "admin",
            "S3_URL": None,
            "S3_Key": None
        }
        
        existing_check = users_table.scan(
            FilterExpression=Attr('username').eq(admin_data["username"]) | 
                           Attr('email').eq(admin_data["email"])
        )
        
        if existing_check.get("Items"):
            raise HTTPException(status_code=400, detail="Admin user with this username or email already exists")
        
        users_table.put_item(Item=admin_item)
        
        response_data = admin_item.copy()
        del response_data["password"]
        
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
                           Attr('role').eq('admin')
        )
        
        admin_users = response.get("Items", [])
        
        if not admin_users:
            # Debug: Print what we're looking for
            print(f"No admin found with username: {username}")
            # Let's also check what admins exist
            all_admins = users_table.scan(FilterExpression=Attr('role').eq('admin'))
            print(f"All admins: {[admin.get('username') for admin in all_admins.get('Items', [])]}")
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        admin_user = admin_users[0]
        
        if not verify_password(password, admin_user.get("password", "")):
            print(f"Password verification failed for user: {username}")
            print(f"Stored password exists: {bool(admin_user.get('password'))}")
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        session_key = generate_secure_key()
        
        admin_sessions[session_key] = {
            "admin_id": admin_user["user_id"],
            "username": admin_user["username"],
            "full_name": admin_user["username"],
            "created": datetime.utcnow(),
            "expires": datetime.utcnow() + timedelta(hours=24)
        }
        
        return {
            "message": "Admin login successful",
            "admin_id": admin_user["user_id"],
            "admin_key": session_key,
            "full_name": admin_user.get("username"),
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
            if "password" in user:
                del user["password"]
        
        return {
            "count": len(admin_users),
            "admin_users": admin_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin users: {str(e)}")


# USER MANAGEMENT ENDPOINTS
@router.get("/users/all")
async def get_all_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    limit: int = Query(100),
    admin_verified: bool = Depends(verify_admin)
):
    """Get all users with search and filter options"""
    try:
        filter_expression = None
        
        if role:
            filter_expression = Attr('role').eq(role)
        
        scan_params = {"Limit": limit}
        if filter_expression:
            scan_params["FilterExpression"] = filter_expression
            
        response = users_table.scan(**scan_params)
        users = response.get("Items", [])
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            users = [u for u in users if (
                search_lower in u.get('full_name', '').lower() or
                search_lower in u.get('email', '').lower() or
                search_lower in u.get('username', '').lower()
            )]
        
        # Remove sensitive data
        for user in users:
            user.pop('password_hash', None)
            user.pop('password', None)
        
        # Sort by creation date
        users.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            "count": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")


@router.patch("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str = Path(...),
    password_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Reset a user's password"""
    try:
        new_password = password_data.get("new_password")
        if not new_password or len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Check if user exists
        response = users_table.get_item(Key={"user_id": user_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update password
        users_table.update_item(
            Key={"user_id": user_id},
            UpdateExpression="SET password = :password",
            ExpressionAttributeValues={
                ":password": hashed_password
            }
        )
        
        return {"message": "Password reset", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")

@router.put("/users/{user_id}/profile")
async def update_user_profile(
    user_id: str = Path(...),
    profile_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Update a user's profile information"""
    try:
        # Check if user exists
        response = users_table.get_item(Key={"user_id": user_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update expression  
        update_expression = "SET "
        expression_values = {}
        first_field = True
        
        allowed_fields = ["username", "email"]
        for field in allowed_fields:
            if field in profile_data:
                if not first_field:
                    update_expression += ", "
                update_expression += f"{field} = :{field}"
                expression_values[f":{field}"] = profile_data[field]
                first_field = False
        
        if first_field:  # No fields to update
            return {"message": "No fields to update", "user_id": user_id}
        
        users_table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        return {"message": "Profile updated", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user profile: {str(e)}")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str = Path(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Delete a user account"""
    try:
        # Check if user exists
        response = users_table.get_item(Key={"user_id": user_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response["Item"]
        if user.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Cannot delete admin users")
        
        # Delete the user
        users_table.delete_item(Key={"user_id": user_id})
        
        return {"message": "User deleted", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")


# REQUEST/REPORT MANAGEMENT ENDPOINTS
@router.get("/requests/all")
async def get_all_requests(
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100),
    admin_verified: bool = Depends(verify_admin)
):
    """Get all assistance requests with filters"""
    try:
        response = requests_table.scan(Limit=limit)
        requests = response.get("Items", [])
        
        # Apply filters
        if status:
            requests = [r for r in requests if r.get('status') == status]
        
        if region:
            requests = [r for r in requests if r.get('req_region', '').lower().find(region.lower()) != -1]
        
        if search:
            search_lower = search.lower()
            requests = [r for r in requests if (
                search_lower in r.get('user_name', '').lower() or
                search_lower in r.get('req_details', '').lower() or
                search_lower in r.get('req_region', '').lower()
            )]
        
        # Sort by creation date
        requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            "count": len(requests),
            "requests": requests
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requests: {str(e)}")

@router.patch("/requests/{request_id}/status")
async def update_request_status(
    request_id: str = Path(...),
    status_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Update request status"""
    try:
        new_status = status_data.get("status")
        admin_note = status_data.get("admin_note", "")
        
        if new_status not in ["pending", "in_progress", "resolved", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Check if request exists
        response = requests_table.get_item(Key={"request_id": request_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Update status
        update_expression = "SET #status = :status, updated_at = :timestamp"
        expression_values = {
            ":status": new_status,
            ":timestamp": datetime.utcnow().isoformat()
        }
        expression_names = {"#status": "status"}
        
        if admin_note:
            update_expression += ", admin_note = :note, admin_updated_at = :admin_time"
            expression_values[":note"] = admin_note
            expression_values[":admin_time"] = datetime.utcnow().isoformat()
        
        requests_table.update_item(
            Key={"request_id": request_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names
        )
        
        return {
            "message": "Status updated",
            "request_id": request_id,
            "new_status": new_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating request status: {str(e)}")

@router.patch("/requests/{request_id}/assign")
async def assign_request_to_expert(
    request_id: str = Path(...),
    assign_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Assign request to an expert"""
    try:
        expert_id = assign_data.get("expert_id")
        
        # Verify expert exists and has expert role
        expert_response = users_table.get_item(Key={"user_id": expert_id})
        if "Item" not in expert_response:
            raise HTTPException(status_code=404, detail="Expert not found")
        
        expert = expert_response["Item"]
        if expert.get("role") != "expert":
            raise HTTPException(status_code=400, detail="User is not an expert")
        
        # Update request
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
        
        return {
            "message": "Request assigned",
            "request_id": request_id,
            "assigned_to": expert_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning request: {str(e)}")

@router.post("/requests/{request_id}/notes")
async def add_admin_note_to_request(
    request_id: str = Path(...),
    note_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Add admin note to request"""
    try:
        note = note_data.get("note")
        if not note:
            raise HTTPException(status_code=400, detail="Note content is required")
        
        # Get current request
        response = requests_table.get_item(Key={"request_id": request_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = response["Item"]
        admin_notes = request.get("admin_notes", [])
        
        # Add new note
        new_note = {
            "note_id": str(uuid4()),
            "note": note,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": "admin"
        }
        admin_notes.append(new_note)
        
        # Update request
        requests_table.update_item(
            Key={"request_id": request_id},
            UpdateExpression="SET admin_notes = :notes, updated_at = :timestamp",
            ExpressionAttributeValues={
                ":notes": admin_notes,
                ":timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return {
            "message": "Note added",
            "note": new_note
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


# GLOBAL ANNOUNCEMENTS ENDPOINTS
@router.post("/announcements")
async def create_announcement(
    announcement_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Create a global announcement"""
    try:
        # Create announcements table if not exists
        try:
            announcements_table = dynamodb.Table('cloud60-announcements')
            announcements_table.load()
        except:
            announcements_table = dynamodb.create_table(
                TableName='cloud60-announcements',
                KeySchema=[
                    {'AttributeName': 'announcement_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'announcement_id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            announcements_table.wait_until_exists()
        
        announcement_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            "announcement_id": announcement_id,
            "title": announcement_data.get("title"),
            "content": announcement_data.get("content"),
            "is_active": announcement_data.get("is_active", True),
            "created_at": timestamp,
            "updated_at": timestamp,
            "created_by": "admin"
        }
        
        announcements_table.put_item(Item=item)
        
        return {
            "message": "Announcement created",
            "announcement_id": announcement_id,
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating announcement: {str(e)}")

@router.get("/announcements")
async def get_announcements(
    active_only: bool = Query(True),
    admin_verified: bool = Depends(verify_admin)
):
    """Get all announcements"""
    try:
        announcements_table = dynamodb.Table('cloud60-announcements')
        
        if active_only:
            response = announcements_table.scan(
                FilterExpression=Attr('is_active').eq(True)
            )
        else:
            response = announcements_table.scan()
        
        announcements = response.get("Items", [])
        
        # Sort by creation date (newest first)
        announcements.sort(
            key=lambda x: x.get('created_at', ''),
            reverse=True
        )
        
        return {
            "count": len(announcements),
            "announcements": announcements
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching announcements: {str(e)}")

@router.put("/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str = Path(...),
    update_data: dict = Body(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Update an announcement"""
    try:
        announcements_table = dynamodb.Table('cloud60-announcements')
        
        # Check if announcement exists
        response = announcements_table.get_item(Key={"announcement_id": announcement_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Build update expression
        update_expression = "SET updated_at = :timestamp"
        expression_values = {":timestamp": datetime.utcnow().isoformat()}
        expression_names = {}
        
        allowed_fields = ["title", "content", "is_active"]
        for field in allowed_fields:
            if field in update_data:
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = update_data[field]
        
        update_params = {
            "Key": {"announcement_id": announcement_id},
            "UpdateExpression": update_expression,
            "ExpressionAttributeValues": expression_values
        }
        
        if expression_names:
            update_params["ExpressionAttributeNames"] = expression_names
            
        announcements_table.update_item(**update_params)
        
        return {"message": "Announcement updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating announcement: {str(e)}")

@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str = Path(...),
    admin_verified: bool = Depends(verify_admin)
):
    """Delete an announcement"""
    try:
        announcements_table = dynamodb.Table('cloud60-announcements')
        
        announcements_table.delete_item(Key={"announcement_id": announcement_id})
        
        return {"message": "Announcement deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting announcement: {str(e)}")

@router.get("/public/announcements")
async def get_public_announcements():
    """Get active announcements for public display"""
    try:
        announcements_table = dynamodb.Table('cloud60-announcements')
        
        response = announcements_table.scan(
            FilterExpression=Attr('is_active').eq(True)
        )
        
        announcements = response.get("Items", [])
        current_time = datetime.utcnow().isoformat()
        
        # All active announcements (no expiration check needed)
        active_announcements = announcements
        
        # Sort by creation date (newest first)
        active_announcements.sort(
            key=lambda x: x.get('created_at', ''),
            reverse=True
        )
        
        return {
            "count": len(active_announcements),
            "announcements": active_announcements
        }
    except Exception as e:
        # If table doesn't exist, return empty
        return {"count": 0, "announcements": []}