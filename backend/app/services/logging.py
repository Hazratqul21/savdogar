"""
Structured logging for SmartPOS with sensitive data filtering.
"""

import logging
import json
import re
from datetime import datetime
from typing import Any, Dict, Optional
from app.core.config import settings

# Configure root logger with settings
log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

# Configure root logger
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Sensitive data patterns to filter
SENSITIVE_PATTERNS = [
    (r'password["\']?\s*[:=]\s*["\']?([^"\']+)', r'password": "***"'),
    (r'secret["\']?\s*[:=]\s*["\']?([^"\']+)', r'secret": "***"'),
    (r'api[_-]?key["\']?\s*[:=]\s*["\']?([^"\']+)', r'api_key": "***"'),
    (r'token["\']?\s*[:=]\s*["\']?([^"\']+)', r'token": "***"'),
    (r'authorization["\']?\s*[:=]\s*["\']?([^"\']+)', r'authorization": "***"'),
    (r'pgpassword["\']?\s*[:=]\s*["\']?([^"\']+)', r'pgpassword": "***"'),
]


def filter_sensitive_data(text: str) -> str:
    """Filter sensitive data from log messages."""
    filtered = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        filtered = re.sub(pattern, replacement, filtered, flags=re.IGNORECASE)
    return filtered


class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging with sensitive data filtering."""
    
    def format(self, record: logging.LogRecord) -> str:
        # Get base message and filter sensitive data
        message = record.getMessage()
        if settings.is_production():
            message = filter_sensitive_data(message)
        
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": message,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            exc_text = self.formatException(record.exc_info)
            if settings.is_production():
                exc_text = filter_sensitive_data(exc_text)
            log_data["exception"] = exc_text
        
        if hasattr(record, "extra_data"):
            extra = record.extra_data.copy()
            # Filter sensitive fields from extra data
            sensitive_fields = ["password", "secret", "api_key", "token", "authorization", "pgpassword"]
            for field in sensitive_fields:
                if field in extra:
                    extra[field] = "***"
            log_data.update(extra)
        
        return json.dumps(log_data, ensure_ascii=False)


def get_logger(name: str, use_json: bool = None) -> logging.Logger:
    """
    Get a logger with our configuration.
    
    Args:
        name: Logger name (typically __name__)
        use_json: Use JSON formatter (default: True in production)
    """
    logger = logging.getLogger(name)
    
    # Use JSON formatter in production or if explicitly requested
    if use_json is None:
        use_json = settings.is_production()
    
    if use_json and not any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, JSONFormatter) 
                           for h in logger.handlers):
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(log_level)
    
    return logger


def log_request(method: str, path: str, status_code: int, duration_ms: float, user_id: int = None):
    """Log HTTP request."""
    logger = get_logger("api.request")
    logger.info(
        f"{method} {path} {status_code}",
        extra={
            "extra_data": {
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
            }
        }
    )


def log_sale(sale_id: int, total: float, items_count: int, user_id: int):
    """Log sale transaction."""
    logger = get_logger("business.sale")
    logger.info(
        f"Sale #{sale_id} completed",
        extra={
            "extra_data": {
                "sale_id": sale_id,
                "total": total,
                "items_count": items_count,
                "user_id": user_id,
            }
        }
    )


def log_error(error: str, details: Dict[str, Any] = None):
    """Log error."""
    logger = get_logger("app.error")
    logger.error(
        error,
        extra={"extra_data": details or {}}
    )
