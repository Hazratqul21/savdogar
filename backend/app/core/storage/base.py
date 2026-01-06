"""
Base storage interface to avoid circular imports.
"""

from abc import ABC, abstractmethod
from typing import Optional

class StorageInterface(ABC):
    """Abstract storage interface."""
    
    @abstractmethod
    def upload_file(self, file_content: bytes, filename: str, subdirectory: Optional[str] = None) -> str:
        """
        Upload file and return URL or path.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            subdirectory: Optional subdirectory (e.g., 'receipts', 'invoices')
        
        Returns:
            URL or path to the uploaded file
        """
        pass
    
    @abstractmethod
    def download_file(self, file_path: str) -> bytes:
        """
        Download file content.
        
        Args:
            file_path: Path or URL to the file
        
        Returns:
            File content as bytes
        """
        pass
    
    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file.
        
        Args:
            file_path: Path or URL to the file
        
        Returns:
            True if deleted, False otherwise
        """
        pass
    
    @abstractmethod
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists.
        
        Args:
            file_path: Path or URL to the file
        
        Returns:
            True if exists, False otherwise
        """
        pass




