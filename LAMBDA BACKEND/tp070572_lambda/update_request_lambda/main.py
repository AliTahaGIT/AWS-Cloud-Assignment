import boto3
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Body, Query
from mangum import Mangum

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
requests_table = dynamodb.Table("Requests")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.patch("/prod/admin/requests/{request_id}/status")
async def update_request_status(
    request_id: str = Path(...),
    status_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    new_status = status_data.get("status")
    admin_note = status_data.get("admin_note", "")
    
    if new_status not in ["pending", "in_progress", "resolved", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    response = requests_table.get_item(Key={"request_id": request_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_expression = "SET #status = :status, updated_at = :timestamp"
    expression_values = {
        ":status": new_status, 
        ":timestamp": datetime.utcnow().isoformat()
    }
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

@app.post("/prod/admin/requests/{request_id}/notes")
async def add_admin_note_to_request(
    request_id: str = Path(...),
    note_data: dict = Body(...),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
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

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)