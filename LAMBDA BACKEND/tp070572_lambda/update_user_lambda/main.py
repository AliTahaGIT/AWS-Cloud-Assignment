import boto3
from fastapi import FastAPI, HTTPException, Path, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from werkzeug.security import generate_password_hash

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.patch("/prod/admin/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str = Path(...),
    password_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
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

@app.put("/prod/admin/users/{user_id}/profile")
async def update_user_profile(
    user_id: str = Path(...),
    profile_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
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

@app.delete("/prod/admin/users/{user_id}")
async def delete_user(
    user_id: str = Path(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    response = users_table.get_item(Key={"user_id": user_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="User not found")
    
    if response["Item"].get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin")
    
    users_table.delete_item(Key={"user_id": user_id})
    return {"success": True}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)