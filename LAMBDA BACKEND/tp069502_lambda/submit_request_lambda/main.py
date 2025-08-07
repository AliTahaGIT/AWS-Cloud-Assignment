
import boto3
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse
from mangum import Mangum
from datetime import datetime
from uuid import uuid4

app = FastAPI()
dynamodb = boto3.resource("dynamodb")

requests_table = dynamodb.Table("Requests")

@app.post("/prod/submit_request")
def submit_request(
    user_email: str = Form(...),
    user_name: str = Form(...),
    req_type: str = Form(...),
    req_details: str = Form(...),
    req_region: str = Form(...)
):
    try:
        timestamp = datetime.utcnow().isoformat()
        request_id = str(uuid4())
        requests_table.put_item(Item={
            "request_id": request_id,
            "user_email": user_email,
            "user_name": user_name,
            "req_type": req_type,
            "req_details": req_details,
            "req_region": req_region,
            "created_at": timestamp
        })
        return {"message": "Request submitted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
