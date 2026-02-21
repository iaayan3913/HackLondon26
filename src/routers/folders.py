from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime
import os
import aiofiles.os

from database import get_db
from schemas import FolderCreate, FolderUpdate, FolderResponse

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("", response_model=List[FolderResponse])
async def get_folders(parent_id: Optional[int] = None, sort: Optional[str] = "name"):
    """Get all folders at root level or with specific parent"""
    # Whitelist of allowed sort options to prevent SQL injection
    SORT_OPTIONS = {
        "name": "LOWER(name) ASC",
        "date": "created_at DESC",
    }
    
    db = await get_db()
    try:
        # For size sorting (by item_count), we need to handle it after fetching
        # For other sorts, add to query
        if sort == "size":
            # Fetch folders without sorting, we'll sort by item_count in Python
            if parent_id is None:
                cursor = await db.execute(
                    "SELECT * FROM folders WHERE parent_id IS NULL"
                )
            else:
                cursor = await db.execute(
                    "SELECT * FROM folders WHERE parent_id = ?",
                    (parent_id,)
                )
        else:
            # Use SQL sorting for name and date
            sort_clause = SORT_OPTIONS.get(sort, SORT_OPTIONS["name"])  # Default to name if invalid
            if parent_id is None:
                cursor = await db.execute(
                    f"SELECT * FROM folders WHERE parent_id IS NULL ORDER BY {sort_clause}"
                )
            else:
                cursor = await db.execute(
                    f"SELECT * FROM folders WHERE parent_id = ? ORDER BY {sort_clause}",
                    (parent_id,)
                )
        
        folders = await cursor.fetchall()
        
        # Get item count for each folder
        result = []
        for folder in folders:
            # Count subfolders
            cursor = await db.execute(
                "SELECT COUNT(*) as count FROM folders WHERE parent_id = ?",
                (folder["id"],)
            )
            subfolder_count = (await cursor.fetchone())["count"]
            
            # Count files
            cursor = await db.execute(
                "SELECT COUNT(*) as count FROM files WHERE folder_id = ?",
                (folder["id"],)
            )
            file_count = (await cursor.fetchone())["count"]
            
            result.append(FolderResponse(
                id=folder["id"],
                name=folder["name"],
                parent_id=folder["parent_id"],
                item_count=subfolder_count + file_count,
                created_at=folder["created_at"],
                updated_at=folder["updated_at"]
            ))
        
        # Sort by item_count if requested (done in Python after calculating counts)
        if sort == "size":
            result.sort(key=lambda x: x.item_count, reverse=True)
        
        return result
    finally:
        await db.close()

@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(folder_id: int):
    """Get a specific folder with its contents"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ?",
            (folder_id,)
        )
        folder = await cursor.fetchone()
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Count subfolders
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM folders WHERE parent_id = ?",
            (folder_id,)
        )
        subfolder_count = (await cursor.fetchone())["count"]
        
        # Count files
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM files WHERE folder_id = ?",
            (folder_id,)
        )
        file_count = (await cursor.fetchone())["count"]
        
        return FolderResponse(
            id=folder["id"],
            name=folder["name"],
            parent_id=folder["parent_id"],
            item_count=subfolder_count + file_count,
            created_at=folder["created_at"],
            updated_at=folder["updated_at"]
        )
    finally:
        await db.close()

@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(folder: FolderCreate):
    """Create a new folder"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO folders (name, parent_id) VALUES (?, ?)",
            (folder.name, folder.parent_id)
        )
        await db.commit()
        
        folder_id = cursor.lastrowid
        
        # Fetch the created folder
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ?",
            (folder_id,)
        )
        created_folder = await cursor.fetchone()
        
        return FolderResponse(
            id=created_folder["id"],
            name=created_folder["name"],
            parent_id=created_folder["parent_id"],
            item_count=0,
            created_at=created_folder["created_at"],
            updated_at=created_folder["updated_at"]
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await db.close()

@router.patch("/{folder_id}", response_model=FolderResponse)
async def update_folder(folder_id: int, folder_update: FolderUpdate):
    """Rename a folder"""
    db = await get_db()
    try:
        # Check if folder exists
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ?",
            (folder_id,)
        )
        existing_folder = await cursor.fetchone()
        
        if not existing_folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Update folder
        await db.execute(
            "UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (folder_update.name, folder_id)
        )
        await db.commit()
        
        # Get updated folder
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ?",
            (folder_id,)
        )
        updated_folder = await cursor.fetchone()
        
        # Get item count
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM folders WHERE parent_id = ?",
            (folder_id,)
        )
        subfolder_count = (await cursor.fetchone())["count"]
        
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM files WHERE folder_id = ?",
            (folder_id,)
        )
        file_count = (await cursor.fetchone())["count"]
        
        return FolderResponse(
            id=updated_folder["id"],
            name=updated_folder["name"],
            parent_id=updated_folder["parent_id"],
            item_count=subfolder_count + file_count,
            created_at=updated_folder["created_at"],
            updated_at=updated_folder["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await db.close()

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: int):
    """Delete a folder and all its contents"""
    db = await get_db()
    try:
        # Check if folder exists
        cursor = await db.execute(
            "SELECT * FROM folders WHERE id = ?",
            (folder_id,)
        )
        folder = await cursor.fetchone()
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Get all files in this folder to delete from disk
        cursor = await db.execute(
            "SELECT stored_name FROM files WHERE folder_id = ?",
            (folder_id,)
        )
        files = await cursor.fetchall()
        
        # Delete files from disk
        storage_path = "storage"
        for file in files:
            file_path = os.path.join(storage_path, file["stored_name"])
            try:
                if os.path.exists(file_path):
                    await aiofiles.os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
        
        # Delete folder (cascade will delete files and subfolders from DB)
        await db.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
        await db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.close()
