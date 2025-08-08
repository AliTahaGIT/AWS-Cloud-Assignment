
import boto3
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from datetime import datetime
from uuid import uuid4
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
dynamodb = boto3.resource("dynamodb")

requests_table = dynamodb.Table("Requests")

class SubmitRequestModel(BaseModel):
    user_email: str
    user_name: str
    req_type: str
    req_details: str
    req_region: str

@app.post("/prod/submit_request")
def submit_request(request: SubmitRequestModel):
    try:
        timestamp = datetime.utcnow().isoformat()
        request_id = str(uuid4())
        requests_table.put_item(Item={
            "request_id": request_id,
            "user_email": request.user_email,
            "user_name": request.user_name,
            "req_type": request.req_type,
            "req_details": request.req_details,
            "req_region": request.req_region,
            "created_at": timestamp
        })
        return {"message": "Request submitted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
