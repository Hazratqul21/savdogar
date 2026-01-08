"""
Supabase Storage implementation for file uploads.
Optimized for Vercel + Supabase infrastructure.
"""
import os
from typing import Optional
from datetime import datetime, timedelta
from app.core.storage.base import StorageInterface
from app.core.config import settings
from app.services.logging import get_logger

logger = get_logger(__name__)

try:
    from supabase import create_client, Client
except ImportError:
    logger.warning("Supabase client not installed. Install with: pip install supabase")
    Client = None


class SupabaseStorage(StorageInterface):
    """
    Supabase Storage adapter for file uploads.
    Uses Supabase Storage API with service role key for secure access.
    """
    
    def __init__(self, supabase_url: str, service_role_key: str, bucket_name: str = "invoices"):
        """
        Initialize Supabase Storage client.
        
        Args:
            supabase_url: Supabase project URL
            service_role_key: Supabase service role key (for backend access)
            bucket_name: Storage bucket name (default: "invoices")
        """
        if Client is None:
            raise ImportError("Supabase client not installed. Install with: pip install supabase")
        
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key
        self.bucket_name = bucket_name
        
        # Initialize Supabase client with service role key
        self.client: Client = create_client(supabase_url, service_role_key)
        
        logger.info(f"Initialized Supabase Storage with bucket: {bucket_name}")
    
    def upload_file(
        self, 
        file_content: bytes, 
        filename: str, 
        subdirectory: Optional[str] = None
    ) -> str:
        """
        Upload file to Supabase Storage.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            subdirectory: Optional subdirectory (e.g., 'receipts', 'invoices')
        
        Returns:
            Public URL to the uploaded file
        """
        try:
            # Construct file path
            if subdirectory:
                file_path = f"{subdirectory}/{filename}"
            else:
                file_path = filename
            
            # Upload to Supabase Storage
            # Note: Supabase Python client expects file-like object or bytes
            self.client.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": self._get_content_type(filename),
                    "upsert": "true"  # Overwrite if exists
                }
            )
            
            # Get public URL
            public_url_response = self.client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            # Handle both string and dict responses
            if isinstance(public_url_response, dict):
                public_url = public_url_response.get("publicUrl", public_url_response.get("url", ""))
            else:
                public_url = public_url_response
            
            logger.info(f"Uploaded file to Supabase Storage: {file_path}")
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading file to Supabase Storage: {e}", exc_info=True)
            raise
    
    def download_file(self, file_path: str) -> bytes:
        """
        Download file from Supabase Storage.
        
        Args:
            file_path: Path to the file in storage
        
        Returns:
            File content as bytes
        """
        try:
            # Extract path from URL if full URL provided
            if file_path.startswith("http"):
                # Extract path from Supabase URL
                # Format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
                parts = file_path.split("/object/public/")
                if len(parts) > 1:
                    file_path = parts[1].split("/", 1)[1] if "/" in parts[1] else parts[1]
            
            response = self.client.storage.from_(self.bucket_name).download(file_path)
            return response
            
        except Exception as e:
            logger.error(f"Error downloading file from Supabase Storage: {e}", exc_info=True)
            raise
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from Supabase Storage.
        
        Args:
            file_path: Path to the file in storage
        
        Returns:
            True if deleted, False otherwise
        """
        try:
            # Extract path from URL if full URL provided
            if file_path.startswith("http"):
                parts = file_path.split("/object/public/")
                if len(parts) > 1:
                    file_path = parts[1].split("/", 1)[1] if "/" in parts[1] else parts[1]
            
            self.client.storage.from_(self.bucket_name).remove([file_path])
            logger.info(f"Deleted file from Supabase Storage: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file from Supabase Storage: {e}", exc_info=True)
            return False
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in Supabase Storage.
        
        Args:
            file_path: Path to the file in storage
        
        Returns:
            True if exists, False otherwise
        """
        try:
            # Extract path from URL if full URL provided
            if file_path.startswith("http"):
                parts = file_path.split("/object/public/")
                if len(parts) > 1:
                    file_path = parts[1].split("/", 1)[1] if "/" in parts[1] else parts[1]
            
            # List files in the directory to check existence
            # Note: Supabase Storage doesn't have a direct "exists" API
            # So we try to get file info
            files = self.client.storage.from_(self.bucket_name).list(
                path=os.path.dirname(file_path) if "/" in file_path else ""
            )
            
            filename = os.path.basename(file_path)
            return any(f.get("name") == filename for f in files)
            
        except Exception as e:
            logger.warning(f"Error checking file existence in Supabase Storage: {e}")
            return False
    
    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Get signed URL for temporary access (optional helper method).
        
        Args:
            file_path: Path to the file in storage
            expires_in: Expiration time in seconds (default: 1 hour)
        
        Returns:
            Signed URL
        """
        try:
            # Extract path from URL if full URL provided
            if file_path.startswith("http"):
                parts = file_path.split("/object/public/")
                if len(parts) > 1:
                    file_path = parts[1].split("/", 1)[1] if "/" in parts[1] else parts[1]
            
            response = self.client.storage.from_(self.bucket_name).create_signed_url(
                path=file_path,
                expires_in=expires_in
            )
            return response.get("signedURL", "")
            
        except Exception as e:
            logger.error(f"Error creating signed URL: {e}", exc_info=True)
            raise
    
    def is_ephemeral(self) -> bool:
        """Supabase Storage is persistent (not ephemeral)."""
        return False
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type from filename extension."""
        ext = filename.lower().split('.')[-1]
        content_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'heic': 'image/heic',
            'heif': 'image/heif',
            'pdf': 'application/pdf',
        }
        return content_types.get(ext, 'application/octet-stream')
