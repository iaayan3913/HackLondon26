from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TranscriptionRecord(BaseModel):
    id: str
    filename: str
    status: str  # queued, transcribing, completed, error
    duration: Optional[float] = None  # seconds
    date: datetime
    transcript: Optional[str] = None
    error: Optional[str] = None
