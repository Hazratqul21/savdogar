"""
Storage abstraction layer for file uploads.
✅ SECURITY FIX: Supports cloud storage (Supabase) to prevent data loss in serverless.
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
    Returns appropriate storage adapter (Supabase or Local).
    """
    global _storage_instance
    
    if _storage_instance is not None:
        return _storage_instance
    
    # Lazy imports to avoid circular dependencies
    from app.core.storage.local_storage import LocalStorage
    from app.core.storage.supabase_storage import SupabaseStorage
    
    storage_type = settings.STORAGE_TYPE.lower()
    
    if storage_type == "supabase":
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Supabase storage selected but credentials not set. Falling back to local storage.")
            _storage_instance = LocalStorage()
        else:
            _storage_instance = SupabaseStorage(
                supabase_url=settings.SUPABASE_URL,
                service_role_key=settings.SUPABASE_SERVICE_ROLE_KEY,
                bucket_name=settings.SUPABASE_STORAGE_BUCKET
            )
            logger.info(f"Using Supabase Storage for file uploads (bucket: {settings.SUPABASE_STORAGE_BUCKET})")
    
    else:
        # Default to local storage
        _storage_instance = LocalStorage()
        if settings.is_production():
            logger.warning(
                "Using local storage in production! "
                "Files will be lost in serverless environments. "
                "Set STORAGE_TYPE=supabase and configure Supabase Storage."
            )
    
    return _storage_instance


