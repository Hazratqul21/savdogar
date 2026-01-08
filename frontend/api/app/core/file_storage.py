"""
File storage utilities with cloud storage support.
✅ SECURITY FIX: Supports Supabase Storage to prevent data loss in serverless environments.
"""

import os
import tempfile
from typing import Optional
from app.core.config import settings
from app.core.storage import get_storage
from app.services.logging import get_logger

logger = get_logger(__name__)


def get_upload_dir() -> str:
    """
    Get upload directory path (for local storage only).
    
    WARNING: In serverless, this is ephemeral storage.
    Files will be lost when function execution ends.
    Use cloud storage (Supabase) in production.
    """
    upload_dir = settings.UPLOAD_DIR
    
    # Ensure directory exists (for local storage)
    if settings.STORAGE_TYPE.lower() == "local":
        os.makedirs(upload_dir, exist_ok=True)
        
        # Log warning in production if using ephemeral storage
        if settings.is_production() and upload_dir.startswith("/tmp"):
            logger.warning(
                "Using ephemeral storage (/tmp) in production! "
                "Files will be lost. Set STORAGE_TYPE=supabase and configure Supabase Storage."
            )
    
    return upload_dir


def is_ephemeral_storage() -> bool:
    """Check if using ephemeral storage (will be lost in serverless)."""
    storage = get_storage()
    if hasattr(storage, 'is_ephemeral'):
        return storage.is_ephemeral()
    return settings.UPLOAD_DIR.startswith("/tmp") or settings.UPLOAD_DIR.startswith(tempfile.gettempdir())


def get_file_path(filename: str, subdirectory: Optional[str] = None) -> str:
    """
    Get file path (for local storage) or prepare for cloud storage.
    
    ⚠️ DEPRECATED: Use upload_file() instead for cloud storage compatibility.
    
    Args:
        filename: Name of the file
        subdirectory: Optional subdirectory (e.g., 'receipts', 'invoices')
    
    Returns:
        Full path to the file (local) or placeholder path (cloud)
    """
    # For backward compatibility, return local path
    # But recommend using upload_file() for cloud storage
    upload_dir = get_upload_dir()
    
    if subdirectory:
        upload_dir = os.path.join(upload_dir, subdirectory)
        if settings.STORAGE_TYPE.lower() == "local":
            os.makedirs(upload_dir, exist_ok=True)
    
    return os.path.join(upload_dir, filename)


def upload_file(file_content: bytes, filename: str, subdirectory: Optional[str] = None) -> str:
    """
    ✅ SECURITY FIX: Upload file using configured storage (cloud or local).
    
    Args:
        file_content: File content as bytes
        filename: Name of the file
        subdirectory: Optional subdirectory (e.g., 'receipts', 'invoices')
    
    Returns:
        URL (cloud) or path (local) to the uploaded file
    """
    storage = get_storage()
    return storage.upload_file(file_content, filename, subdirectory)


def download_file(file_path: str) -> bytes:
    """
    Download file from storage (cloud or local).
    
    Args:
        file_path: URL (cloud) or path (local) to the file
    
    Returns:
        File content as bytes
    """
    storage = get_storage()
    return storage.download_file(file_path)


def cleanup_file(file_path: str) -> bool:
    """
    Clean up a file (cloud or local).
    
    Args:
        file_path: URL (cloud) or path (local) to the file
    
    Returns:
        True if deleted, False otherwise
    """
    storage = get_storage()
    return storage.delete_file(file_path)


def file_exists(file_path: str) -> bool:
    """
    Check if file exists in storage (cloud or local).
    
    Args:
        file_path: URL (cloud) or path (local) to the file
    
    Returns:
        True if exists, False otherwise
    """
    storage = get_storage()
    return storage.file_exists(file_path)




