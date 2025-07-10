from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UpdatePostModel(BaseModel):
    Post_Title: str
    Post_Desc: str

# Admin Models - TP070572
class FloodNotificationCreate(BaseModel):
    title: str
    message: str
    severity: str  # "low", "medium", "high", "critical"
    affected_regions: list[str]
    is_active: bool = True

class FloodNotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
    affected_regions: Optional[list[str]] = None
    is_active: Optional[bool] = None

class EmergencyContactCreate(BaseModel):
    name: str
    role: str
    phone: str
    email: str
    region: str
    is_active: bool = True

class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    region: Optional[str] = None
    is_active: Optional[bool] = None
