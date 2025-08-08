import boto3
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum

app = FastAPI()
dynamodb = boto3.resource("dynamodb")
requests_table = dynamodb.Table("Requests")  

@app.get("/prod/get_user_requests")
def get_user_requests(email: str = Query(...)):
    try:
        response = requests_table.scan()
        all_items = response.get("Items", [])
        user_items = [item for item in all_items if item.get("user_email") == email]
        return user_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)