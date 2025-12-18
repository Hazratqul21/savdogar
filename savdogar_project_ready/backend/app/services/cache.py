"""
Simple in-memory caching for API responses.
In production, replace with Redis.
"""

from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import hashlib
import json

# Simple in-memory cache
_cache: Dict[str, Dict] = {}


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate cache key from arguments."""
    key_data = f"{prefix}:{json.dumps(args)}:{json.dumps(kwargs, sort_keys=True)}"
    return hashlib.md5(key_data.encode()).hexdigest()


def get_cached(key: str) -> Optional[Any]:
    """Get value from cache."""
    if key in _cache:
        entry = _cache[key]
        if datetime.utcnow() < entry["expires"]:
            return entry["value"]
        else:
            del _cache[key]
    return None


def set_cached(key: str, value: Any, ttl_seconds: int = 300):
    """Set value in cache with TTL."""
    _cache[key] = {
        "value": value,
        "expires": datetime.utcnow() + timedelta(seconds=ttl_seconds)
    }


def clear_cache(prefix: str = None):
    """Clear cache entries."""
    global _cache
    if prefix:
        _cache = {k: v for k, v in _cache.items() if not k.startswith(prefix)}
    else:
        _cache = {}


def cached(prefix: str, ttl_seconds: int = 300):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = get_cache_key(prefix, *args[1:], **kwargs)  # Skip 'self' or 'db'
            
            cached_value = get_cached(key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            set_cached(key, result, ttl_seconds)
            return result
        return wrapper
    return decorator


# Cache statistics
def get_cache_stats() -> Dict:
    """Get cache statistics."""
    now = datetime.utcnow()
    valid = sum(1 for v in _cache.values() if now < v["expires"])
    expired = len(_cache) - valid
    
    return {
        "total_entries": len(_cache),
        "valid_entries": valid,
        "expired_entries": expired,
    }
