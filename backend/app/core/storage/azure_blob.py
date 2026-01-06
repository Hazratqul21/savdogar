"""
Azure Blob Storage adapter for persistent file storage.
✅ SECURITY FIX: Prevents data loss in serverless environments.
"""

import os
from typing import Optional
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.core.exceptions import AzureError, ResourceNotFoundError
from app.core.storage.base import StorageInterface
from app.services.logging import get_logger

logger = get_logger(__name__)


class AzureBlobStorage(StorageInterface):
    """Azure Blob Storage adapter."""
    
    def __init__(self, connection_string: str, container_name: str = "uploads"):
        """
        Initialize Azure Blob Storage client.
        
        Args:
            connection_string: Azure Storage connection string
            container_name: Name of the blob container
        """
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            self.container_name = container_name
            
            # Ensure container exists
            self._ensure_container_exists()
            
            logger.info(f"Azure Blob Storage initialized with container: {container_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Azure Blob Storage: {e}")
            raise
    
    def _ensure_container_exists(self):
        """Create container if it doesn't exist."""
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            if not container_client.exists():
                container_client.create_container()
                logger.info(f"Created Azure Blob Storage container: {self.container_name}")
        except Exception as e:
            logger.error(f"Failed to ensure container exists: {e}")
            raise
    
    def _get_blob_path(self, filename: str, subdirectory: Optional[str] = None) -> str:
        """Get blob path (with optional subdirectory)."""
        # Sanitize filename to prevent path traversal
        filename = os.path.basename(filename)
        
        if subdirectory:
            # Sanitize subdirectory
            subdirectory = subdirectory.replace("..", "").replace("/", "_")
            return f"{subdirectory}/{filename}"
        return filename
    
    def upload_file(self, file_content: bytes, filename: str, subdirectory: Optional[str] = None) -> str:
        """Upload file to Azure Blob Storage."""
        try:
            blob_path = self._get_blob_path(filename, subdirectory)
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_path
            )
            
            # Upload file
            blob_client.upload_blob(file_content, overwrite=True)
            
            # Return blob URL
            blob_url = blob_client.url
            logger.debug(f"File uploaded to Azure Blob Storage: {blob_url}")
            return blob_url
            
        except AzureError as e:
            logger.error(f"Azure Blob Storage upload error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error uploading to Azure Blob Storage: {e}")
            raise
    
    def download_file(self, file_path: str) -> bytes:
        """Download file from Azure Blob Storage."""
        try:
            # Extract blob name from URL or use as-is
            if file_path.startswith("http"):
                # Extract blob name from URL
                # Format: https://account.blob.core.windows.net/container/blob_name
                blob_name = "/".join(file_path.split("/")[4:])  # Skip https://account.blob.core.windows.net/container/
            else:
                blob_name = file_path
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Download file
            return blob_client.download_blob().readall()
            
        except ResourceNotFoundError:
            raise FileNotFoundError(f"File not found in Azure Blob Storage: {file_path}")
        except AzureError as e:
            logger.error(f"Azure Blob Storage download error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error downloading from Azure Blob Storage: {e}")
            raise
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from Azure Blob Storage."""
        try:
            # Extract blob name from URL or use as-is
            if file_path.startswith("http"):
                blob_name = "/".join(file_path.split("/")[4:])
            else:
                blob_name = file_path
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Delete blob
            blob_client.delete_blob()
            logger.debug(f"File deleted from Azure Blob Storage: {blob_name}")
            return True
            
        except ResourceNotFoundError:
            logger.warning(f"File not found for deletion: {file_path}")
            return False
        except AzureError as e:
            logger.error(f"Azure Blob Storage delete error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting from Azure Blob Storage: {e}")
            return False
    
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in Azure Blob Storage."""
        try:
            # Extract blob name from URL or use as-is
            if file_path.startswith("http"):
                blob_name = "/".join(file_path.split("/")[4:])
            else:
                blob_name = file_path
            
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            return blob_client.exists()
            
        except Exception as e:
            logger.warning(f"Error checking file existence: {e}")
            return False


