"""
Database Configuration for SmartPOS CRM API
Optimized for Supabase and Vercel serverless environment.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
import logging
import os

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# =============================================================================
# Database URL Configuration
# =============================================================================
_raw_url = settings.database_url

# FIX: SQLAlchemy 2.0 requires 'postgresql://' not 'postgres://'
# Supabase and Heroku use 'postgres://' which is deprecated
if _raw_url and _raw_url.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = _raw_url.replace("postgres://", "postgresql://", 1)
    logging.info("🔧 Fixed database URL: postgres:// -> postgresql://")
else:
    SQLALCHEMY_DATABASE_URL = _raw_url

# Detect database type
is_supabase = any([
    "supabase.co" in (SQLALCHEMY_DATABASE_URL or "").lower(),
    "pooler.supabase.com" in (SQLALCHEMY_DATABASE_URL or "").lower(),
])
is_session_pooler = ":6543" in (SQLALCHEMY_DATABASE_URL or "")
is_cloud_db = is_supabase or "sslmode=require" in (SQLALCHEMY_DATABASE_URL or "").lower()

# Log connection info (without sensitive data)
try:
    from urllib.parse import urlparse
    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    host_display = parsed.hostname or "unknown"
    port_display = parsed.port or "5432"
    logger.info(f"📊 Database: {host_display}:{port_display}")
    if is_supabase:
        pooler_type = "Session Pooler" if is_session_pooler else "Direct"
        logger.info(f"🔗 Supabase {pooler_type} connection detected")
except Exception:
    logger.info("📊 Database URL configured")


# =============================================================================
# Connection Arguments
# =============================================================================
connect_args = {}

# SSL configuration for cloud databases
if is_cloud_db:
    # Supabase and other cloud DBs require SSL
    connect_args["sslmode"] = "require"
    logger.info("🔒 SSL enabled for cloud database")

# Connection timeout (important for serverless)
connect_args["connect_timeout"] = 10


# =============================================================================
# Connection Pooling Configuration
# =============================================================================
# For serverless environments (Vercel), NullPool is recommended
# because each function invocation is independent

if settings.is_production():
    # Production: Use NullPool for serverless
    pool_class = NullPool
    logger.info("🏊 Using NullPool (serverless optimized)")
    engine_kwargs = {
        "poolclass": pool_class,
        "pool_pre_ping": True,
        "echo": False,
    }
else:
    # Development: Use connection pool
    pool_class = QueuePool
    logger.info("🏊 Using QueuePool (development)")
    engine_kwargs = {
        "poolclass": pool_class,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
        "pool_timeout": 30,
        "pool_pre_ping": True,
        "echo": False,
    }

# Store pool class for health check
_POOL_CLASS = pool_class


# =============================================================================
# Create Engine
# =============================================================================
try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        **engine_kwargs
    )
    logger.info("✅ Database engine created successfully")
except Exception as e:
    logger.error(f"❌ Failed to create database engine: {e}")
    raise


# =============================================================================
# Session Factory
# =============================================================================
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# =============================================================================
# Database Dependency
# =============================================================================
def get_db():
    """
    Database session dependency for FastAPI.
    
    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()


# =============================================================================
# Health Check
# =============================================================================
def check_database_health() -> dict:
    """
    Check database connection health.
    
    Returns:
        dict with status information
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as health, version() as ver"))
            row = result.fetchone()
            
            # Get pool info if available
            pool_info = {}
            if hasattr(engine.pool, 'size'):
                pool_info["pool_size"] = engine.pool.size()
            if hasattr(engine.pool, 'checkedout'):
                pool_info["connections_used"] = engine.pool.checkedout()
            
            return {
                "status": "healthy",
                "connected": True,
                "version": str(row[1])[:50] if row else "unknown",
                "pool_type": _POOL_CLASS.__name__,
                "is_supabase": is_supabase,
                "is_session_pooler": is_session_pooler,
                **pool_info
            }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Database health check failed: {error_msg}")
        
        # Provide helpful error message
        if "timeout" in error_msg.lower():
            hint = "Connection timeout - check DATABASE_URL and network"
        elif "ssl" in error_msg.lower() or "certificate" in error_msg.lower():
            hint = "SSL error - ensure ?sslmode=require in DATABASE_URL"
        elif "password" in error_msg.lower() or "authentication" in error_msg.lower():
            hint = "Authentication failed - check database credentials"
        elif "could not connect" in error_msg.lower():
            hint = "Cannot connect - check DATABASE_URL host and port"
        else:
            hint = "Check DATABASE_URL configuration"
        
        return {
            "status": "unhealthy",
            "connected": False,
            "error": error_msg[:200] if not settings.is_production() else hint,
            "hint": hint,
            "pool_type": _POOL_CLASS.__name__,
            "is_supabase": is_supabase,
        }


# =============================================================================
# Test Connection on Import (optional, can be disabled for faster cold starts)
# =============================================================================
if os.getenv("TEST_DB_ON_IMPORT", "false").lower() == "true":
    try:
        health = check_database_health()
        if health["status"] == "healthy":
            logger.info("✅ Database connection verified")
        else:
            logger.warning(f"⚠️ Database connection issue: {health.get('hint', 'unknown')}")
    except Exception as e:
        logger.warning(f"⚠️ Could not verify database connection: {e}")
