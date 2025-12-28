"""
Structured logging for SmartPOS.
"""

import logging
import json
from datetime import datetime
from typing import Any, Dict
import os

# Log level from environment
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Configure root logger
logging.basicConfig(
    level=LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with our configuration."""
    logger = logging.getLogger(name)
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
