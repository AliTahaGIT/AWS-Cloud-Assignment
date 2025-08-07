import boto3
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from datetime import datetime

app = FastAPI()
handler = Mangum(app)



dynamodb = boto3.resource("dynamodb")
posts_table = dynamodb.Table("Posts")

@app.get("/")
def get_posts():
    try:
        response = posts_table.scan()
        items = response.get("Items", [])
        sorted_items = sorted(
            items,
            key=lambda x: datetime.fromisoformat(x["Post_CreateDate"].split(".")[0]),
            reverse=True
        )
        return sorted_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


