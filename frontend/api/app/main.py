from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.v1.endpoints.receipts import public_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.core.config import settings
from app.core.setup import auto_setup


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup: Run automatic setup
    await auto_setup()
    yield
    # Shutdown: (nothing to clean up for now)


app = FastAPI(
    title="SmartPOS CRM API",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# CORS Configuration - Dynamic based on environment
def get_cors_origins() -> list[str]:
    """Get allowed CORS origins based on environment."""
    origins = []
    
    # If CORS_ORIGINS is explicitly set, use it
    if settings.CORS_ORIGINS:
        origins.extend([origin.strip() for origin in settings.CORS_ORIGINS.split(",")])
    
    # For monorepo deployment (same domain), allow same origin
    # In production, if FRONTEND_URL is not set, we're on the same domain
    if settings.is_production():
        if settings.FRONTEND_URL:
            origins.append(settings.FRONTEND_URL)
        # If no FRONTEND_URL, assume same domain (monorepo)
        # CORS will work automatically for same-origin requests
    else:
        # Development: allow localhost
        origins.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ])
    
    # Remove duplicates and empty strings
    origins = list(set(filter(None, origins)))
    
    # If no origins specified and in production, allow all (not recommended but functional)
    # Better to set CORS_ORIGINS explicitly
    if not origins and settings.is_production():
        # Log warning but allow (for backward compatibility)
        import logging
        logging.warning(
            "No CORS origins configured in production. "
            "Consider setting CORS_ORIGINS or FRONTEND_URL environment variable."
        )
        origins = ["*"]  # Fallback for monorepo (same domain)
    elif not origins:
        # Development fallback
        origins = ["*"]
    
    return origins

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(public_router, prefix="/verify", tags=["public"])

# Explicit OPTIONS handler for CORS preflight (fixes 405 errors)
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle CORS preflight OPTIONS requests"""
    from fastapi import Response
    
    # Get origin from request
    origin = request.headers.get("origin", "*")
    
    # Check if origin is in allowed origins
    allowed_origins = get_cors_origins()
    if origin not in allowed_origins and "*" not in allowed_origins:
        # If origin not allowed, use first allowed origin or *
        origin = allowed_origins[0] if allowed_origins else "*"
    elif "*" in allowed_origins:
        origin = "*"
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )

@app.get("/health")
def health_check():
    """Enhanced health check with system info and database status."""
    from datetime import datetime
    from app.services.cache import get_cache_stats
    from app.middleware.rate_limit import get_rate_limit_stats
    from app.core.database import check_database_health
    
    db_health = check_database_health()
    
    # Overall status is unhealthy if database is unhealthy
    overall_status = "healthy" if db_health.get("status") == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "service": "SmartPOS CRM Backend",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_health,
        "cache": get_cache_stats(),
        "rate_limit": get_rate_limit_stats(),
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartPOS CRM API"}
