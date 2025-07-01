from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import posts_table, s3, BUCKET
from uuid import uuid4
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

#################################### ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) PARTS #########################################
@app.post("/create-post")
async def create_post(
    Post_Title: str = Form(...),
    Post_Organization: str = Form(...),
    Post_Desc: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        file_ext = image.filename.split('.')[-1]
        key = f"posts/{uuid4()}.{file_ext}"

        s3.upload_fileobj(image.file, BUCKET, key, ExtraArgs={"ContentType": image.content_type, "ACL": "public-read"})
        image_url = f"https://{BUCKET}.s3.amazonaws.com/{key}"

        post_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()

        posts_table.put_item(Item={
            "Post_ID": post_id,
            "Post_Title": Post_Title,
            "Post_Organization": Post_Organization,
            "Post_IMG": image_url,
            "Post_S3Key": key,
            "Post_Desc": Post_Desc,
            "Post_CreateDate": timestamp
        })

        return {"message": "Post created", "PostID": post_id, "image_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.get("/posts")
def get_posts():
    try:
        response = posts_table.scan()
        items = response.get("Items", [])

        # Sort items by Post_CreateDate descending (newest first)
        sorted_items = sorted(
            items,
            key=lambda x: datetime.fromisoformat(x["Post_CreateDate"].split(".")[0]),
            reverse=True
        )

        return sorted_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#####################################################################################################################################