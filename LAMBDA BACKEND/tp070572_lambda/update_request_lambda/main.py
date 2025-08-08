import boto3
import json

from jwt_utils import verify_admin_token
from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Body, Depends
from mangum import Mangum
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

@app.put("/prod/admin/requests/{request_id}")
async def update_request_status(
    request_id: str = Path(...),
    update_data: dict = Body(...),
    _: dict = Depends(verify_admin_token)
):
    response = requests_table.get_item(Key={"id": request_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_expression = "SET updated_at = :timestamp"
    expression_names = {}
    expression_values = {":timestamp": datetime.utcnow().isoformat()}
    
    if "status" in update_data:
        update_expression += ", #status = :status"
        expression_names["#status"] = "status"
        expression_values[":status"] = update_data["status"]
    
    if "assigned_to" in update_data:
        update_expression += ", assigned_to = :assigned"
        expression_values[":assigned"] = update_data["assigned_to"]
    
    if "admin_notes" in update_data:
        update_expression += ", admin_notes = :notes"
        expression_values[":notes"] = update_data["admin_notes"]
    
    if expression_names:
        requests_table.update_item(
            Key={"id": request_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
    else:
        requests_table.update_item(
            Key={"id": request_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
    
    return {"success": True, "id": request_id}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)