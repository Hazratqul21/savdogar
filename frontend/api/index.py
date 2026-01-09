"""
Vercel Serverless Function Entrypoint for FastAPI
Uses Mangum to convert FastAPI ASGI app to AWS Lambda/API Gateway format

This file is the entry point for all API requests in the Vercel serverless environment.
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("vercel-api")

# Add current directory to Python path for imports
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Import FastAPI app
try:
    from mangum import Mangum
    from app.main import app
    from app.core.config import settings
    from urllib.parse import urlparse
    
    # Log environment configuration (masked for security)
    logger.info("=" * 60)
    logger.info("🚀 Initializing SmartPOS CRM API on Vercel")
    logger.info("=" * 60)
    logger.info(f"📦 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🌐 Frontend URL: {settings.FRONTEND_URL or 'Not set'}")
    
    # Log database URL info (masked)
    db_url = settings.database_url
    try:
        parsed = urlparse(db_url)
        host_display = parsed.hostname or "unknown"
        port_display = parsed.port or "5432"
        user_display = parsed.username or "unknown"
        is_pooler = ":6543" in db_url or "pooler.supabase.com" in host_display.lower()
        pooler_type = "Session Pooler (✅)" if is_pooler else "Direct (⚠️)"
        logger.info(f"📊 Database Host: {host_display}:{port_display}")
        logger.info(f"📊 Database User: {user_display}")
        logger.info(f"📊 Connection Type: {pooler_type}")
        logger.info(f"📊 Has SSL: {'✅' if 'sslmode=require' in db_url else '❌'}")
    except Exception as e:
        logger.warning(f"⚠️ Could not parse DATABASE_URL: {e}")
    
    # Check if DATABASE_URL is set
    if not settings.DATABASE_URL and not settings.POSTGRES_URL:
        logger.error("❌ DATABASE_URL or POSTGRES_URL not set in environment variables!")
    else:
        logger.info("✅ DATABASE_URL is configured")
    
    # Check SECRET_KEY
    if settings.SECRET_KEY and len(settings.SECRET_KEY) >= 32:
        logger.info("✅ SECRET_KEY is configured")
    else:
        logger.warning("⚠️ SECRET_KEY is missing or too short!")
    
    logger.info("=" * 60)
    
    # Create Mangum handler for Vercel serverless functions
    # Configuration optimized for Vercel environment
    handler = Mangum(
        app,
        lifespan="off",  # Vercel handles function lifecycle
        text_mime_types=[
            "application/json",
            "text/plain",
            "application/x-www-form-urlencoded",
            "text/html",
        ],
    )
    
    logger.info("✅ Mangum handler initialized successfully")
    
except Exception as e:
    logger.error(f"❌ Failed to initialize handler: {e}")
    import traceback
    logger.error(traceback.format_exc())
    
    # Fallback handler for error cases
    def handler(event, context):
        return {
            "statusCode": 500,
            "body": f"Server initialization error: {str(e)}",
            "headers": {
                "Content-Type": "text/plain",
                "Access-Control-Allow-Origin": "*",
            }
        }

# Export handler for Vercel (required)
# Vercel Python runtime looks for 'handler' function at module level
__all__ = ['handler']
