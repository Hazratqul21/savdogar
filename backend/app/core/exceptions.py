"""
Centralized error handling and exception utilities.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class APIError(HTTPException):
    """Base API error with structured response."""
    
    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        hide_internal: bool = True
    ):
        """
        Create structured API error.
        
        Args:
            status_code: HTTP status code
            message: User-friendly error message
            error_code: Machine-readable error code
            details: Additional error details
            hide_internal: Hide internal details in production
        """
        self.error_code = error_code
        self.details = details or {}
        self.hide_internal = hide_internal
        
        # In production, don't expose internal error details
        if settings.is_production() and hide_internal:
            detail = message
        else:
            detail = message
            if details:
                detail = f"{message} | Details: {details}"
        
        super().__init__(status_code=status_code, detail=detail)


def handle_database_error(error: Exception) -> HTTPException:
    """Handle database-related errors with user-friendly messages."""
    error_msg = str(error).lower()
    
    # SSL/Certificate errors (common with Supabase)
    if "ssl" in error_msg or "certificate" in error_msg or "cert verify failed" in error_msg:
        logger.error(f"Database SSL error: {error}", exc_info=True)
        return APIError(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="Database SSL ulanishida xatolik. Iltimos, database sozlamalarini tekshiring.",
            error_code="DB_SSL_ERROR",
            details={"original_error": str(error)[:200]} if not settings.is_production() else None
        )
    
    # Database connection errors
    if "connection" in error_msg or "timeout" in error_msg or "could not connect" in error_msg or "connection refused" in error_msg:
        logger.error(f"Database connection error: {error}", exc_info=True)
        return APIError(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="Database serverga ulanib bo'lmadi. Iltimos, keyinroq urinib ko'ring yoki database sozlamalarini tekshiring.",
            error_code="DB_CONNECTION_ERROR",
            details={"original_error": str(error)[:200]} if not settings.is_production() else None
        )
    
    # Table/relation not found (migration issues)
    if "relation" in error_msg and "does not exist" in error_msg:
        logger.error(f"Database schema error: {error}", exc_info=True)
        if "users" in error_msg:
            return APIError(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Database jadvallari yaratilmagan. Iltimos, migration ni ishga tushiring: 'alembic upgrade head'",
                error_code="DB_SCHEMA_ERROR",
                details={"migration_required": True}
            )
        else:
            return APIError(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Database jadvali topilmadi. Migration kerak bo'lishi mumkin.",
                error_code="DB_TABLE_NOT_FOUND",
                details={"original_error": str(error)[:100]} if not settings.is_production() else None
            )
    
    # Generic database error
    logger.error(f"Database error: {error}", exc_info=True)
    return APIError(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="Database operatsiyasida xatolik yuz berdi.",
        error_code="DB_ERROR",
        details={"original_error": str(error)[:100]} if not settings.is_production() else None
    )


def handle_validation_error(error: Exception) -> HTTPException:
    """Handle validation errors."""
    logger.warning(f"Validation error: {error}")
    return APIError(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Ma'lumotlar noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.",
        error_code="VALIDATION_ERROR",
        details={"original_error": str(error)} if not settings.is_production() else None
    )


def handle_not_found_error(resource: str, resource_id: Any = None) -> HTTPException:
    """Handle resource not found errors."""
    message = f"{resource} topilmadi."
    if resource_id is not None:
        message = f"{resource} (ID: {resource_id}) topilmadi."
    
    return APIError(
        status_code=status.HTTP_404_NOT_FOUND,
        message=message,
        error_code="NOT_FOUND",
        details={"resource": resource, "resource_id": resource_id} if not settings.is_production() else None
    )


def handle_permission_error(message: str = "Bu amalni bajarish uchun ruxsatingiz yo'q.") -> HTTPException:
    """Handle permission/authorization errors."""
    return APIError(
        status_code=status.HTTP_403_FORBIDDEN,
        message=message,
        error_code="PERMISSION_DENIED"
    )


def handle_generic_error(error: Exception, context: str = "Operatsiya") -> HTTPException:
    """Handle generic errors with proper logging."""
    logger.error(f"{context} error: {error}", exc_info=True)
    
    # Check if it's a database error
    if "database" in str(error).lower() or "connection" in str(error).lower():
        return handle_database_error(error)
    
    # Generic error
    return APIError(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message=f"{context} bajarishda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring yoki administratorga murojaat qiling.",
        error_code="INTERNAL_ERROR",
        details={"original_error": str(error)[:200]} if not settings.is_production() else None
    )









