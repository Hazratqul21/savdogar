"""
Rate limiting middleware for API protection.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict
import asyncio

# Rate limit storage: {ip: [(timestamp, count)]}
_rate_limits: Dict[str, list] = {}

# Configuration
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = request.client.host
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
        
        # Clean old entries and count requests
        if client_ip in _rate_limits:
            _rate_limits[client_ip] = [
                ts for ts in _rate_limits[client_ip]
                if ts > window_start
            ]
            request_count = len(_rate_limits[client_ip])
        else:
            _rate_limits[client_ip] = []
            request_count = 0
        
        # Check limit
        if request_count >= RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
        
        # Record request
        _rate_limits[client_ip].append(now)
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(RATE_LIMIT_REQUESTS - request_count - 1)
        response.headers["X-RateLimit-Reset"] = str(int((window_start + timedelta(seconds=RATE_LIMIT_WINDOW)).timestamp()))
        
        return response


def get_rate_limit_stats() -> Dict:
    """Get rate limit statistics."""
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
        "active_ips": active_ips,
        "total_requests": total_requests,
        "window_seconds": RATE_LIMIT_WINDOW,
        "limit_per_window": RATE_LIMIT_REQUESTS,
    }
