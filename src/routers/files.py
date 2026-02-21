from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import uuid
import aiofiles
import aiofiles.os
from pathlib import Path

from database import get_db
from schemas import FileResponse as FileResponseSchema, FileUpdate

router = APIRouter(prefix="/files", tags=["files"])

STORAGE_DIR = "storage"

def format_file_size(size_bytes: int) -> str:
    """Format bytes to human-readable size"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_file_type(filename: str) -> str:
    """Extract file type from filename"""
    ext = Path(filename).suffix.upper()
    if ext:
        return ext[1:]  # Remove the dot
    return "UNKNOWN"

def get_mime_type(filename: str) -> str:
    """Get MIME type from filename"""
    ext = Path(filename).suffix.lower()
    mime_types = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
    }
    return mime_types.get(ext, 'application/octet-stream')

@router.get("", response_model=List[FileResponseSchema])
async def get_files(
    folder_id: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "date"
):
    """Get files with optional filtering and sorting"""
    # Whitelist of allowed sort options to prevent SQL injection
    SORT_OPTIONS = {
        "name": "LOWER(name) ASC",
        "date": "created_at DESC",
        "size": "size_bytes DESC",
        "type": "file_type ASC"
    }
    
    db = await get_db()
    try:
        # Build query
        query = "SELECT * FROM files WHERE 1=1"
        params = []
        
        if folder_id is not None:
            query += " AND folder_id = ?"
            params.append(folder_id)
        elif folder_id is None and search is None:
            # If no folder_id specified and no search, get root level files
            query += " AND folder_id IS NULL"
        
        if search:
            query += " AND name LIKE ?"
            params.append(f"%{search}%")
        
        # Add sorting - use whitelist for SQL injection prevention
        sort_clause = SORT_OPTIONS.get(sort, SORT_OPTIONS["date"])  # Default to date if invalid
        query += f" ORDER BY {sort_clause}"
        
        cursor = await db.execute(query, params)
        files = await cursor.fetchall()
        
        result = []
        for file in files:
            result.append(FileResponseSchema(
                id=file["id"],
                name=file["name"],
                file_type=file["file_type"],
                size_bytes=file["size_bytes"],
                size_display=format_file_size(file["size_bytes"]),
                folder_id=file["folder_id"],
                mime_type=file["mime_type"],
                created_at=file["created_at"],
                updated_at=file["updated_at"]
            ))
        
        return result
    finally:
        await db.close()

@router.post("/upload", response_model=FileResponseSchema, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None)
):
    """Upload a file"""
    db = await get_db()
    try:
        # Ensure storage directory exists
        os.makedirs(STORAGE_DIR, exist_ok=True)
        
        # Generate unique filename for storage
        file_extension = Path(file.filename).suffix
        stored_name = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(STORAGE_DIR, stored_name)
        
        # Save file to disk
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Get file size
        file_size = len(content)
        
        # Get file type and mime type
        file_type = get_file_type(file.filename)
        mime_type = get_mime_type(file.filename)
        
        # Save metadata to database
        cursor = await db.execute(
            """INSERT INTO files (name, stored_name, folder_id, file_type, size_bytes, mime_type)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (file.filename, stored_name, folder_id, file_type, file_size, mime_type)
        )
        await db.commit()
        
        file_id = cursor.lastrowid
        
        # Fetch the created file
        cursor = await db.execute(
            "SELECT * FROM files WHERE id = ?",
            (file_id,)
        )
        created_file = await cursor.fetchone()
        
        return FileResponseSchema(
            id=created_file["id"],
            name=created_file["name"],
            file_type=created_file["file_type"],
            size_bytes=created_file["size_bytes"],
            size_display=format_file_size(created_file["size_bytes"]),
            folder_id=created_file["folder_id"],
            mime_type=created_file["mime_type"],
            created_at=created_file["created_at"],
            updated_at=created_file["updated_at"]
        )
    except Exception as e:
        await db.rollback()
        # Clean up file if database insert fails
        if os.path.exists(file_path):
            await aiofiles.os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        await db.close()

@router.get("/{file_id}/download")
async def download_file(file_id: int):
    """Download a file"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM files WHERE id = ?",
            (file_id,)
        )
        file = await cursor.fetchone()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = os.path.join(STORAGE_DIR, file["stored_name"])
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        return FileResponse(
            path=file_path,
            filename=file["name"],
            media_type=file["mime_type"]
        )
    finally:
        await db.close()

@router.patch("/{file_id}", response_model=FileResponseSchema)
async def update_file(file_id: int, file_update: FileUpdate):
    """Update file metadata (rename or move)"""
    db = await get_db()
    try:
        # Check if file exists
        cursor = await db.execute(
            "SELECT * FROM files WHERE id = ?",
            (file_id,)
        )
        existing_file = await cursor.fetchone()
        
        if not existing_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Build update query
        updates = []
        params = []
        
        if file_update.name is not None:
            updates.append("name = ?")
            params.append(file_update.name)
            # Update file type if name changed
            new_file_type = get_file_type(file_update.name)
            updates.append("file_type = ?")
            params.append(new_file_type)
        
        if file_update.folder_id is not None:
            updates.append("folder_id = ?")
            params.append(file_update.folder_id)
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(file_id)
            
            query = f"UPDATE files SET {', '.join(updates)} WHERE id = ?"
            await db.execute(query, params)
            await db.commit()
        
        # Get updated file
        cursor = await db.execute(
            "SELECT * FROM files WHERE id = ?",
            (file_id,)
        )
        updated_file = await cursor.fetchone()
        
        return FileResponseSchema(
            id=updated_file["id"],
            name=updated_file["name"],
            file_type=updated_file["file_type"],
            size_bytes=updated_file["size_bytes"],
            size_display=format_file_size(updated_file["size_bytes"]),
            folder_id=updated_file["folder_id"],
            mime_type=updated_file["mime_type"],
            created_at=updated_file["created_at"],
            updated_at=updated_file["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await db.close()

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: int):
    """Delete a file"""
    db = await get_db()
    try:
        # Get file info
        cursor = await db.execute(
            "SELECT * FROM files WHERE id = ?",
            (file_id,)
        )
        file = await cursor.fetchone()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete file from disk
        file_path = os.path.join(STORAGE_DIR, file["stored_name"])
        try:
            if os.path.exists(file_path):
                await aiofiles.os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
        
        # Delete from database
        await db.execute("DELETE FROM files WHERE id = ?", (file_id,))
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.close()
