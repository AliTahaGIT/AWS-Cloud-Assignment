from pydantic import BaseModel
from typing import Optional

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