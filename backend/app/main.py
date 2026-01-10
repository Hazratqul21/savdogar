"""
SmartPOS CRM API - Main Application
Professional FastAPI application with CORS, rate limiting, and health checks.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

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
    
    # Skip auto_setup in serverless environments (Vercel, AWS Lambda)
    # Migrations should be run separately, not on every cold start
    is_serverless = os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    
    if not is_serverless:
        try:
            from app.core.setup import auto_setup
            await auto_setup()
            logger.info("✅ Auto setup completed")
        except Exception as e:
            logger.error(f"⚠️ Auto setup failed: {e}")
    else:
        logger.info("⏭️ Skipping auto_setup (serverless environment)")
    
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
# Configure CORS to allow all origins for separate deployment
# Frontend and backend are now deployed separately, so we allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for separate frontend/backend deployment
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
# CRITICAL: Must be defined BEFORE routers to catch OPTIONS requests first
# =============================================================================
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """
    Handle CORS preflight OPTIONS requests for all paths.
    This ensures all endpoints respond correctly to browser preflight checks.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"✅ OPTIONS request received for path: {full_path}")
    
    # Allow all origins for separate deployment
    response = Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )
    logger.info(f"✅ OPTIONS response sent for path: {full_path}")
    return response


# =============================================================================
# Include Routers
# =============================================================================
app.include_router(api_router, prefix="/api/v1")
app.include_router(public_router, prefix="/verify", tags=["public"])


# =============================================================================
# Health Check Endpoint
# Available at both /health and /api/health for compatibility
# =============================================================================
@app.get("/health")
@app.get("/api/health")
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
@app.get("/api/health/diagnostic")
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
