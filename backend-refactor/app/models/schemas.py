from pydantic import BaseModel

class UpdatePostModel(BaseModel):
    Post_Title: str
    Post_Desc: str
