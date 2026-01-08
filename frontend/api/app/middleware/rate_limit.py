"""
Rate limiting middleware for API protection.
✅ SECURITY FIX: Uses Redis for distributed rate limiting (serverless-compatible).
Falls back to in-memory if Redis is unavailable.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict, Optional
import time

from app.core.redis_client import get_redis_client, is_redis_available
from app.services.logging import get_logger

logger = get_logger(__name__)

# Configuration - Development mode: more permissive limits
RATE_LIMIT_REQUESTS = 500  # requests per window (general endpoints)
RATE_LIMIT_WINDOW = 60  # seconds

# ✅ SECURITY FIX: Stricter limits for authentication endpoints (relaxed for development)
AUTH_RATE_LIMIT_REQUESTS = 50  # 50 attempts per window (development)
AUTH_RATE_LIMIT_WINDOW = 300  # 5 minutes

# Fallback: In-memory storage (used if Redis unavailable)
_rate_limits: Dict[str, list] = {}


def _check_rate_limit_redis(key: str, limit: int, window: int) -> tuple[bool, int, int]:
    """
    Check rate limit using Redis.
    Returns: (is_allowed, current_count, remaining)
    """
    redis_client = get_redis_client()
    if not redis_client:
        return None, 0, limit
    
    try:
        # Use Redis INCR with expiration (sliding window)
        redis_key = f"rate_limit:{key}"
        current_count = redis_client.incr(redis_key)
        
        # Set expiration on first request
        if current_count == 1:
            redis_client.expire(redis_key, window)
        
        remaining = max(0, limit - current_count)
        is_allowed = current_count <= limit
        
        return is_allowed, current_count, remaining
    except Exception as e:
        logger.warning(f"Redis rate limit check failed: {e}. Falling back to in-memory.")
        return None, 0, limit


def _check_rate_limit_memory(key: str, limit: int, window: int) -> tuple[bool, int, int]:
    """
    Check rate limit using in-memory storage (fallback).
    Returns: (is_allowed, current_count, remaining)
    """
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window)
    
    # Clean old entries and count requests
    if key in _rate_limits:
        _rate_limits[key] = [
            ts for ts in _rate_limits[key]
            if ts > window_start
        ]
        current_count = len(_rate_limits[key])
    else:
        _rate_limits[key] = []
        current_count = 0
    
    # Check limit
    is_allowed = current_count < limit
    
    if is_allowed:
        _rate_limits[key].append(now)
        current_count += 1
    
    remaining = max(0, limit - current_count)
    return is_allowed, current_count, remaining


def check_rate_limit(key: str, limit: int, window: int) -> tuple[bool, int, int]:
    """
    Check rate limit (Redis preferred, falls back to memory).
    Returns: (is_allowed, current_count, remaining)
    """
    # Try Redis first
    if is_redis_available():
        result = _check_rate_limit_redis(key, limit, window)
        if result[0] is not None:  # Redis worked
            return result
    
    # Fallback to in-memory
    return _check_rate_limit_memory(key, limit, window)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        
        # ✅ SECURITY FIX: Stricter limits for authentication endpoints
        is_auth_endpoint = path.startswith("/api/v1/auth/")
        
        if is_auth_endpoint:
            limit = AUTH_RATE_LIMIT_REQUESTS
            window = AUTH_RATE_LIMIT_WINDOW
            rate_limit_key = f"auth:{client_ip}"
        else:
            limit = RATE_LIMIT_REQUESTS
            window = RATE_LIMIT_WINDOW
            rate_limit_key = f"api:{client_ip}"
        
        # Check rate limit
        is_allowed, current_count, remaining = check_rate_limit(rate_limit_key, limit, window)
        
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Juda ko'p so'rovlar. Iltimos, keyinroq urinib ko'ring."
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        reset_time = int(time.time()) + window
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        response.headers["X-RateLimit-Used"] = str(current_count)
        
        return response


def get_rate_limit_stats() -> Dict:
    """Get rate limit statistics."""
    redis_client = get_redis_client()
    
    if redis_client and is_redis_available():
        try:
            # Get all rate limit keys from Redis
            keys = redis_client.keys("rate_limit:*")
            active_keys = 0
            total_requests = 0
            
            for key in keys:
                count = redis_client.get(key)
                if count:
                    active_keys += 1
                    total_requests += int(count)
            
            return {
                "storage": "redis",
                "active_ips": active_keys,
                "total_requests": total_requests,
                "window_seconds": RATE_LIMIT_WINDOW,
                "limit_per_window": RATE_LIMIT_REQUESTS,
                "auth_limit": AUTH_RATE_LIMIT_REQUESTS,
                "auth_window_seconds": AUTH_RATE_LIMIT_WINDOW,
            }
        except Exception as e:
            logger.warning(f"Error getting Redis stats: {e}")
    
    # Fallback: in-memory stats
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    active_ips = 0
    total_requests = 0
    
    for ip, timestamps in _rate_limits.items():
        recent = [ts for ts in timestamps if ts > window_start]
        if recent:
            active_ips += 1
            total_requests += len(recent)
    
    return {
        "storage": "memory",
        "active_ips": active_ips,
        "total_requests": total_requests,
        "window_seconds": RATE_LIMIT_WINDOW,
        "limit_per_window": RATE_LIMIT_REQUESTS,
        "auth_limit": AUTH_RATE_LIMIT_REQUESTS,
        "auth_window_seconds": AUTH_RATE_LIMIT_WINDOW,
    }
