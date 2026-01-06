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

# SSL Configuration for Azure/Cloud
ssl_context = None
connect_args = {}

if "azure" in SQLALCHEMY_DATABASE_URL.lower() or "sslmode=require" in SQLALCHEMY_DATABASE_URL.lower():
    # Enforce SSL for Azure/Cloud
    logger.info("[DATABASE] Cloud/Azure configuration detected. Enforcing SSL.")
    
    # If using psycopg2 (default), it handles sslmode=require in the URL usually.
    # But for explicit control or other drivers:
    if "sslmode" not in SQLALCHEMY_DATABASE_URL:
        connect_args["sslmode"] = "require"
        
    # Create default context if strict validation not possible without cert path
    # For serverless/Vercel, often simpler to trust CA or use system store
    if os.getenv("AZURE_CA_PATH"):
        ssl_context = ssl.create_default_context()
        ssl_context.load_verify_locations(os.getenv("AZURE_CA_PATH"))
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl_context"] = ssl_context

# Serverless-optimized connection pooling
# In serverless (Vercel), connections are short-lived, so we use smaller pools
if settings.is_production():
    # Production serverless: smaller pool, faster recycle
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

# Engine Creation with Serverless Optimizations
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    poolclass=pool_class,
    pool_pre_ping=True,       # Critical for recovering from dropped connections
    pool_size=pool_size,      # Optimized for serverless
    max_overflow=max_overflow, # Allow bursts
    pool_recycle=pool_recycle, # Recycle connections frequently
    pool_timeout=pool_timeout, # Fail fast if pool is full
    echo=False,               # Set to True for SQL query logging in development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to get DB session.
    Closes session automatically after request.
    
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
            
            return {
                "status": "healthy",
                "database": "connected",
                "version": row[1][:50] if row else "unknown",
                "pool_size": engine.pool.size(),
                "checked_out": engine.pool.checkedout(),
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)[:100] if not settings.is_production() else "Connection failed"
        }
