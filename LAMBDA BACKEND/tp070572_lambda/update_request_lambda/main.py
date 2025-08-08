import boto3
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

def ensure_table_exists():
    """Create Requests table if it doesn't exist"""
    table_name = "Requests"
    try:
        dynamodb_client.describe_table(TableName=table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)

ensure_table_exists()
requests_table = dynamodb.Table("Requests")

class StatusUpdate(BaseModel):
    status: str
    admin_notes: str = None
    admin_key: str

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.put("/prod/admin/requests/{request_id}/status")
async def update_request_status(request_id: str, update: StatusUpdate):
    verify_admin(update.admin_key)
    
    response = requests_table.get_item(Key={"id": request_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_expression = "SET #status = :status, updated_at = :updated_at"
    expression_names = {"#status": "status"}
    expression_values = {
        ":status": update.status,
        ":updated_at": datetime.utcnow().isoformat()
    }
    
    if update.admin_notes:
        update_expression += ", admin_notes = :notes"
        expression_values[":notes"] = update.admin_notes
    
    requests_table.update_item(
        Key={"id": request_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_names,
        ExpressionAttributeValues=expression_values
    )
    
    return {"message": "Request status updated", "id": request_id, "new_status": update.status}

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    if "requestContext" in event:
        if "http" not in event["requestContext"]:
            event["requestContext"]["http"] = {}
        if "sourceIp" not in event["requestContext"]["http"]:
            event["requestContext"]["http"]["sourceIp"] = "127.0.0.1"
    
    mangum_handler = Mangum(app, lifespan="off")
    response = mangum_handler(event, context)
    
    print(f"Returning response: {json.dumps(response)}")
    
    return response