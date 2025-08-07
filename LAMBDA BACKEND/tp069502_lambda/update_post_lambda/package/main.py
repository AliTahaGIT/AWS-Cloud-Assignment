
import boto3
from fastapi import FastAPI,  HTTPException, Path, Body
from mangum import Mangum
from datetime import datetime

app = FastAPI()
dynamodb = boto3.resource("dynamodb")

posts_table = dynamodb.Table("Posts")


@app.put("/prod/update_post/{post_id}")
def update_post(post_id: str = Path(...), payload: dict = Body(...)):
    try:
        title = payload.get("Post_Title")
        desc = payload.get("Post_Desc")
        if not title or not desc:
            raise HTTPException(status_code=400, detail="Missing Post_Title or Post_Desc")
        response = posts_table.update_item(
            Key={"Post_ID": post_id},
            UpdateExpression="SET Post_Title = :t, Post_Desc = :d",
            ExpressionAttributeValues={":t": title, ":d": desc},
            ReturnValues="UPDATED_NEW"
        )
        return {"message": "Post updated", "updated": response.get("Attributes")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def handler(event, context):
    mangum_handler = Mangum(app)
    return mangum_handler(event, context)
