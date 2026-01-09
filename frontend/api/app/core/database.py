from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings
from app.services.logging import get_logger
import ssl
import os

logger = get_logger(__name__)

# Database URL from settings (includes SSL configuration)
SQLALCHEMY_DATABASE_URL = settings.database_url
logger.info("[DATABASE] Connection URL configured (hidden for security)")

# SSL Configuration for Cloud Databases (Supabase, etc.)
ssl_context = None
connect_args = {}

# Detect Supabase (contains .supabase.co in URL or pooler.supabase.com)
is_supabase = "supabase.co" in (SQLALCHEMY_DATABASE_URL or "").lower() or "pooler.supabase.com" in (SQLALCHEMY_DATABASE_URL or "").lower()
# Detect Session Pooler (port 6543)
is_session_pooler = ":6543" in (SQLALCHEMY_DATABASE_URL or "")
is_cloud_db = "sslmode=require" in (SQLALCHEMY_DATABASE_URL or "").lower() or is_supabase

if is_cloud_db:
    # Enforce SSL for Cloud databases (Supabase, etc.)
    logger.info("[DATABASE] Cloud database configuration detected. Enforcing SSL.")
    
    # Supabase requires SSL with specific settings
    if is_supabase:
        # Supabase SSL configuration
        # Supabase works best with sslmode=require in URL, no explicit SSL context needed
        # psycopg2 handles SSL automatically when sslmode=require is in the URL
        connect_args["sslmode"] = "require"
        # Don't set ssl_context for Supabase - let psycopg2 handle it via URL
        logger.info("[DATABASE] Supabase SSL configuration applied (sslmode=require).")
    else:
        # Other cloud databases
        if "sslmode" not in SQLALCHEMY_DATABASE_URL:
            connect_args["sslmode"] = "require"
        
        # Create default context if strict validation not possible without cert path
        # For serverless/Vercel, often simpler to trust CA or use system store
        if os.getenv("DB_CA_PATH"):
            ssl_context = ssl.create_default_context()
            ssl_context.load_verify_locations(os.getenv("DB_CA_PATH"))
            ssl_context.verify_mode = ssl.CERT_REQUIRED
            connect_args["ssl_context"] = ssl_context

# Serverless-optimized connection pooling
# In serverless (Vercel), connections are short-lived
# For Supabase Session Pooler, NullPool is better (pooler handles pooling)
# For direct Supabase connections, also use NullPool
if settings.is_production():
    # Production serverless: Use NullPool for Supabase (better for serverless)
    if is_supabase:
        pool_class = NullPool  # No connection pooling for serverless + Supabase
        if is_session_pooler:
            logger.info("[DATABASE] Using NullPool for Supabase Session Pooler (port 6543).")
        else:
            logger.info("[DATABASE] Using NullPool for Supabase serverless deployment.")
    else:
        # Other databases: small pool
        pool_class = QueuePool
        pool_size = 2  # Very small for serverless
        max_overflow = 5
        pool_recycle = 180  # 3 minutes (serverless functions are short-lived)
        pool_timeout = 20
else:
    # Development: standard pool
    pool_class = QueuePool
    pool_size = 5
    max_overflow = 10
    pool_recycle = 300  # 5 minutes
    pool_timeout = 30

# Store pool_class for health check
_POOL_CLASS = pool_class

# Engine Creation with Serverless Optimizations
# Add connection timeout for better error handling
connect_args_with_timeout = {**connect_args, "connect_timeout": 10}

engine_kwargs = {
    "connect_args": connect_args_with_timeout,
    "poolclass": pool_class,
    "pool_pre_ping": True,  # Critical for recovering from dropped connections
    "echo": False,  # Set to True for SQL query logging in development
}

# Add pool parameters only if not using NullPool
if pool_class != NullPool:
    engine_kwargs.update({
        "pool_size": pool_size,
        "max_overflow": max_overflow,
        "pool_recycle": pool_recycle,
        "pool_timeout": pool_timeout,
    })

# Add SSL context if configured (only for non-Supabase databases that need it)
if ssl_context and not is_supabase:
    engine_kwargs["connect_args"]["ssl_context"] = ssl_context

# Log connection details (without sensitive info)
try:
    from urllib.parse import urlparse
    parsed_url = urlparse(SQLALCHEMY_DATABASE_URL)
    host_info = parsed_url.netloc.split('@')[-1] if '@' in parsed_url.netloc else parsed_url.netloc
    logger.info(f"[DATABASE] Connecting to: {host_info}")
    if is_session_pooler:
        logger.info("[DATABASE] Using Supabase Session Pooler (port 6543)")
    elif is_supabase:
        logger.info("[DATABASE] Using Supabase Direct Connection")
except Exception:
    logger.info("[DATABASE] Connection URL configured")

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to get DB session.
    Closes session automatically after request.
    Handles connection errors gracefully.
    
    Usage:
        @router.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        error_msg = str(e).lower()
        
        # Log connection errors with more detail for debugging
        if any(keyword in error_msg for keyword in ["connection", "timeout", "ssl", "certificate", "could not connect", "operationalerror"]):
            logger.error(f"Database connection error in session: {e}", exc_info=True)
        else:
            logger.error(f"Database session error: {e}", exc_info=True)
        
        raise
    finally:
        db.close()


def check_database_health() -> dict:
    """
    Check database connection health.
    
    Returns:
        dict with health status and connection info
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as health_check, version() as version"))
            row = result.fetchone()
            
            # Get pool info (NullPool doesn't have size/checkedout)
            pool_info = {}
            if hasattr(engine.pool, 'size'):
                pool_info["pool_size"] = engine.pool.size()
            if hasattr(engine.pool, 'checkedout'):
                pool_info["checked_out"] = engine.pool.checkedout()
            
            return {
                "status": "healthy",
                "database": "connected",
                "version": row[1][:50] if row else "unknown",
                "pool_type": _POOL_CLASS.__name__,
                "is_supabase": is_supabase,
                "is_session_pooler": is_session_pooler,
                **pool_info
            }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Database health check failed: {error_msg}", exc_info=True)
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": error_msg[:200] if not settings.is_production() else "Connection failed",
            "pool_type": _POOL_CLASS.__name__,
            "is_supabase": is_supabase,
            "is_session_pooler": is_session_pooler,
        }
