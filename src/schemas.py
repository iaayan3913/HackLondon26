from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Folder Schemas
class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class FolderUpdate(BaseModel):
    name: str

class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    item_count: int = 0
    created_at: datetime
    updated_at: datetime

# File Schemas
class FileResponse(BaseModel):
    id: int
    name: str
    file_type: str
    size_bytes: int
    size_display: str
    folder_id: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    updated_at: datetime

class FileUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[int] = None
