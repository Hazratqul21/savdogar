"""
SmartPOS CRM API - Main Application
Professional FastAPI application with CORS, rate limiting, and health checks.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.v1.api import api_router
from app.api.v1.endpoints.receipts import public_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting SmartPOS CRM API...")
    try:
        from app.core.setup import auto_setup
        await auto_setup()
        logger.info("✅ Auto setup completed")
    except Exception as e:
        logger.error(f"⚠️ Auto setup failed: {e}")
    yield
    # Shutdown
    logger.info("👋 Shutting down SmartPOS CRM API...")


# Initialize FastAPI application
app = FastAPI(
    title="SmartPOS CRM API",
    description="Professional POS and CRM system for businesses",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# =============================================================================
# CORS Configuration
# =============================================================================
def get_cors_origins() -> list[str]:
    """Get allowed CORS origins based on environment."""
    origins = []
    
    # If CORS_ORIGINS is explicitly set, use it
    if settings.CORS_ORIGINS:
        origins.extend([origin.strip() for origin in settings.CORS_ORIGINS.split(",")])
    
    # Add FRONTEND_URL if set
    if settings.FRONTEND_URL:
        origins.append(settings.FRONTEND_URL)
        # Also add www variant
        if not settings.FRONTEND_URL.startswith("http://localhost"):
            if "www." not in settings.FRONTEND_URL:
                origins.append(settings.FRONTEND_URL.replace("https://", "https://www."))
    
    # Development origins
    if settings.is_development():
        origins.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ])
    
    # Remove duplicates and empty strings
    origins = list(set(filter(None, origins)))
    
    # Fallback: allow all origins if none configured (with warning)
    if not origins:
        if settings.is_production():
            logger.warning(
                "⚠️ No CORS origins configured in production. "
                "Set CORS_ORIGINS or FRONTEND_URL environment variable."
            )
        # Return ["*"] for permissive CORS (monorepo same-origin requests work)
        return ["*"]
    
    return origins


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight for 1 hour
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)


# =============================================================================
# Global OPTIONS Handler (CORS Preflight)
# =============================================================================
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """
    Handle CORS preflight OPTIONS requests for all paths.
    This ensures all endpoints respond correctly to browser preflight checks.
    """
    origin = request.headers.get("origin", "*")
    allowed_origins = get_cors_origins()
    
    # Determine which origin to send back
    if "*" in allowed_origins:
        response_origin = "*"
    elif origin in allowed_origins:
        response_origin = origin
    else:
        response_origin = allowed_origins[0] if allowed_origins else "*"
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": response_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )


# =============================================================================
# Include Routers
# =============================================================================
app.include_router(api_router, prefix="/api/v1")
app.include_router(public_router, prefix="/verify", tags=["public"])


# =============================================================================
# Health Check Endpoint
# =============================================================================
@app.get("/health")
async def health_check():
    """Health check endpoint with database status."""
    from datetime import datetime
    
    # Check database connection
    db_status = {"status": "unknown"}
    try:
        from app.core.database import check_database_health
        db_status = check_database_health()
    except Exception as e:
        db_status = {"status": "error", "error": str(e)[:100]}
    
    # Overall status
    overall_status = "healthy" if db_status.get("status") == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "service": "SmartPOS CRM API",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
    }


@app.get("/health/diagnostic")
async def diagnostic_check():
    """Diagnostic endpoint to check environment configuration (safe for production)."""
    from urllib.parse import urlparse
    
    # Check environment variables (masked)
    env_status = {
        "ENVIRONMENT": settings.ENVIRONMENT,
        "FRONTEND_URL": settings.FRONTEND_URL or "❌ Not set",
        "DATABASE_URL": "✅ Set" if (settings.DATABASE_URL or settings.POSTGRES_URL) else "❌ Not set",
        "SECRET_KEY": "✅ Set" if (settings.SECRET_KEY and len(settings.SECRET_KEY) >= 32) else "❌ Not set or too short",
    }
    
    # Database URL info (masked)
    db_info = {}
    try:
        db_url = settings.database_url
        parsed = urlparse(db_url)
        db_info = {
            "host": parsed.hostname or "unknown",
            "port": parsed.port or "unknown",
            "database": parsed.path.lstrip("/") or "unknown",
            "user": parsed.username or "unknown",
            "is_supabase": "supabase.co" in (parsed.hostname or "").lower() or "pooler.supabase.com" in (parsed.hostname or "").lower(),
            "is_session_pooler": ":6543" in db_url or "pooler.supabase.com" in (parsed.hostname or "").lower(),
            "has_ssl": "sslmode=require" in db_url,
        }
    except Exception as e:
        db_info = {"error": str(e)[:100]}
    
    # Database health
    db_health = {"status": "unknown"}
    try:
        from app.core.database import check_database_health
        db_health = check_database_health()
    except Exception as e:
        db_health = {"status": "error", "error": str(e)[:100]}
    
    return {
        "environment": env_status,
        "database_info": db_info,
        "database_health": db_health,
    }


# =============================================================================
# Root Endpoint
# =============================================================================
@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Welcome to SmartPOS CRM API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# =============================================================================
# Global Exception Handler
# =============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions gracefully."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Don't expose internal errors in production
    if settings.is_production():
        return JSONResponse(
            status_code=500,
            content={"detail": "Ichki server xatosi. Iltimos, keyinroq urinib ko'ring."}
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )
