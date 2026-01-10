"""
Redis client utility for distributed rate limiting and caching.
✅ SECURITY FIX: Replaces in-memory rate limiting with Redis for serverless compatibility.
"""

import redis
from typing import Optional
from app.core.config import settings
from app.services.logging import get_logger

logger = get_logger(__name__)

# Global Redis client instance
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    Get or create Redis client instance.
    Returns None if Redis is not configured (falls back to in-memory).
    """
    global _redis_client
    
    if _redis_client is not None:
        return _redis_client
    
    # Try to connect to Redis
    try:
        if settings.REDIS_URL:
            # Use connection URL if provided
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True
            )
        else:
            # Use individual connection parameters
            _redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True
            )
        
        # Test connection
        _redis_client.ping()
        logger.info("Redis connection established successfully")
        return _redis_client
        
    except redis.ConnectionError as e:
        logger.warning(f"Redis connection failed: {e}. Falling back to in-memory rate limiting.")
        return None
    except Exception as e:
        logger.error(f"Redis initialization error: {e}. Falling back to in-memory rate limiting.")
        return None


def is_redis_available() -> bool:
    """Check if Redis is available and connected."""
    client = get_redis_client()
    if client is None:
        return False
    
    try:
        client.ping()
        return True
    except Exception:
        return False


def close_redis_connection():
    """Close Redis connection (useful for cleanup)."""
    global _redis_client
    if _redis_client:
        try:
            _redis_client.close()
        except Exception as e:
            logger.warning(f"Error closing Redis connection: {e}")
        finally:
            _redis_client = None






