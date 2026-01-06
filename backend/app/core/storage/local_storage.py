"""
Local file storage adapter (for development or non-serverless environments).
✅ SECURITY FIX: Maintains backward compatibility while preparing for cloud migration.
"""

import os
import tempfile
from typing import Optional
from app.core.storage.base import StorageInterface
from app.core.config import settings
from app.services.logging import get_logger

logger = get_logger(__name__)


class LocalStorage(StorageInterface):
    """Local filesystem storage adapter."""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
        
        # Warn if using ephemeral storage in production
        if settings.is_production() and self.upload_dir.startswith("/tmp"):
            logger.warning(
                "Using ephemeral storage (/tmp) in production! "
                "Files will be lost in serverless environments. "
                "Consider using Azure Blob Storage or S3."
            )
    
    def upload_file(self, file_content: bytes, filename: str, subdirectory: Optional[str] = None) -> str:
        """Upload file to local filesystem."""
        # Sanitize filename to prevent path traversal
        filename = os.path.basename(filename)
        
        if subdirectory:
            upload_dir = os.path.join(self.upload_dir, subdirectory)
            os.makedirs(upload_dir, exist_ok=True)
        else:
            upload_dir = self.upload_dir
        
        file_path = os.path.join(upload_dir, filename)
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.debug(f"File uploaded to local storage: {file_path}")
        return file_path
    
    def download_file(self, file_path: str) -> bytes:
        """Download file from local filesystem."""
        # Prevent path traversal
        if not os.path.abspath(file_path).startswith(os.path.abspath(self.upload_dir)):
            raise ValueError(f"Invalid file path: {file_path}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, "rb") as f:
            return f.read()
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from local filesystem."""
        try:
            # Prevent path traversal
            if not os.path.abspath(file_path).startswith(os.path.abspath(self.upload_dir)):
                logger.warning(f"Attempted to delete file outside upload directory: {file_path}")
                return False
            
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug(f"File deleted from local storage: {file_path}")
                return True
        except Exception as e:
            logger.warning(f"Failed to delete file {file_path}: {e}")
        
        return False
    
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in local filesystem."""
        # Prevent path traversal
        if not os.path.abspath(file_path).startswith(os.path.abspath(self.upload_dir)):
            return False
        
        return os.path.exists(file_path)
    
    def is_ephemeral(self) -> bool:
        """Check if using ephemeral storage."""
        return self.upload_dir.startswith("/tmp") or self.upload_dir.startswith(tempfile.gettempdir())


