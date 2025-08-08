import boto3
from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum

app = FastAPI()

dynamodb = boto3.resource("dynamodb")
requests_table = dynamodb.Table("Requests")

def verify_admin(admin_key: str):
    if not admin_key:
        raise HTTPException(status_code=403, detail="Admin key required")
    return True

@app.get("/prod/admin/requests")
async def get_all_requests(
    status: str = Query(None),
    region: str = Query(None),
    search: str = Query(None),
    limit: int = Query(100),
    admin_key: str = Query(...)
):
    verify_admin(admin_key)
    
    response = requests_table.scan(Limit=limit)
    requests = response.get("Items", [])
    
    if status:
        requests = [r for r in requests if r.get('status') == status]
    if region:
        requests = [
            r for r in requests 
            if r.get('req_region', '').lower().find(region.lower()) != -1
        ]
    if search:
        search_lower = search.lower()
        requests = [
            r for r in requests 
            if (search_lower in r.get('user_name', '').lower() or 
                search_lower in r.get('req_details', '').lower() or 
                search_lower in r.get('req_region', '').lower())
        ]
    
    requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"count": len(requests), "requests": requests}

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)