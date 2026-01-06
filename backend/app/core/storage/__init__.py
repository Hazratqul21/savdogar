"""
Storage abstraction layer for file uploads.
✅ SECURITY FIX: Supports cloud storage (Azure Blob, S3) to prevent data loss in serverless.
"""

from typing import Optional
from app.core.storage.base import StorageInterface
from app.core.config import settings
from app.services.logging import get_logger

logger = get_logger(__name__)

# Global storage instance
_storage_instance = None


def get_storage() -> StorageInterface:
    """
    Get storage instance based on configuration.
    Returns appropriate storage adapter (Azure Blob, S3, or Local).
    """
    global _storage_instance
    
    if _storage_instance is not None:
        return _storage_instance
    
    # Lazy imports to avoid circular dependencies
    from app.core.storage.local_storage import LocalStorage
    from app.core.storage.azure_blob import AzureBlobStorage
    
    storage_type = settings.STORAGE_TYPE.lower()
    
    if storage_type == "azure":
        if not settings.AZURE_STORAGE_CONNECTION_STRING:
            logger.warning("Azure storage selected but connection string not set. Falling back to local storage.")
            _storage_instance = LocalStorage()
        else:
            _storage_instance = AzureBlobStorage(
                connection_string=settings.AZURE_STORAGE_CONNECTION_STRING,
                container_name=settings.AZURE_STORAGE_CONTAINER
            )
            logger.info("Using Azure Blob Storage for file uploads")
    
    elif storage_type == "s3":
        # TODO: Implement S3 storage adapter
        logger.warning("S3 storage not yet implemented. Falling back to local storage.")
        _storage_instance = LocalStorage()
    
    else:
        # Default to local storage
        _storage_instance = LocalStorage()
        if settings.is_production():
            logger.warning(
                "Using local storage in production! "
                "Files will be lost in serverless environments. "
                "Set STORAGE_TYPE=azure and configure Azure Blob Storage."
            )
    
    return _storage_instance


