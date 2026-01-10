"""
Vercel Serverless Function Entrypoint for FastAPI
==================================================
This file MUST be at: backend/api/index.py

Vercel Python Runtime automatically detects this file and uses Mangum
to convert FastAPI ASGI app to AWS Lambda/Vercel serverless format.
"""
import sys
import os

# =============================================================================
# CRITICAL: Set up Python path BEFORE any imports
# =============================================================================
# This file is at: backend/api/index.py
# When Vercel uses backend/ as root directory, we need to ensure
# the backend directory is in Python path so imports like "from app.main" work.
CURRENT_FILE = os.path.abspath(__file__)  # Full absolute path to this file
CURRENT_DIR = os.path.dirname(CURRENT_FILE)  # backend/api/ (absolute)
BACKEND_DIR = os.path.dirname(CURRENT_DIR)  # backend/ (absolute)

# Normalize path to handle any symlinks or path variations
BACKEND_DIR = os.path.realpath(BACKEND_DIR)

# Add backend directory to Python path for proper imports
# This ensures "from app.main import app" finds backend/app/main.py
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Log path setup for debugging (before logger is configured)
# This helps diagnose path issues in Vercel deployment
print(f"[PATH SETUP] Current file: {CURRENT_FILE}")
print(f"[PATH SETUP] Backend directory: {BACKEND_DIR}")
print(f"[PATH SETUP] Python path: {sys.path[:3]}")

# =============================================================================
# Configure logging EARLY (before other imports)
# =============================================================================
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("vercel-api")

# =============================================================================
# Import and Initialize FastAPI App
# =============================================================================
try:
    # Import Mangum adapter for serverless
    from mangum import Mangum
    
    # Import FastAPI app from app.main
    from app.main import app
    
    # Import settings for logging
    from app.core.config import settings
    
    # Log successful initialization
    logger.info("=" * 60)
    logger.info("🚀 SmartPOS CRM API - Vercel Serverless Function")
    logger.info("=" * 60)
    logger.info(f"📦 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🐍 Python Path: {BACKEND_DIR}")
    
    # Check critical settings
    if settings.DATABASE_URL or settings.POSTGRES_URL:
        logger.info("✅ Database URL configured")
    else:
        logger.warning("⚠️ DATABASE_URL not set!")
    
    if settings.SECRET_KEY and len(settings.SECRET_KEY) >= 32:
        logger.info("✅ Secret Key configured")
    else:
        logger.warning("⚠️ SECRET_KEY not configured properly!")
    
    logger.info("=" * 60)
    
    # =============================================================================
    # Create Mangum Handler for Vercel
    # =============================================================================
    # Mangum wraps FastAPI ASGI app for AWS Lambda / Vercel Serverless
    # Vercel Python runtime automatically detects 'handler' variable
    handler = Mangum(
        app,
        lifespan="off",  # Vercel manages function lifecycle
    )
    
    logger.info("✅ Mangum handler initialized successfully")

except ImportError as e:
    # Handle import errors (missing dependencies)
    logger.error(f"❌ Import Error: {e}")
    import traceback
    logger.error(traceback.format_exc())
    
    def handler(event, context):
        """Fallback handler for import errors"""
        error_msg = str(e)
        return {
            "statusCode": 500,
            "body": f'{{"error": "Import Error", "detail": "{error_msg}", "hint": "Check requirements.txt and dependencies"}}',
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        }

except Exception as e:
    # Handle any other initialization errors
    logger.error(f"❌ Initialization Error: {e}")
    import traceback
    logger.error(traceback.format_exc())
    
    def handler(event, context):
        """Fallback handler for initialization errors"""
        error_msg = str(e).replace('"', "'")  # Escape quotes for JSON
        return {
            "statusCode": 500,
            "body": f'{{"error": "Server Initialization Error", "detail": "{error_msg}"}}',
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        }

# =============================================================================
# Export handler for Vercel
# =============================================================================
# Vercel Python runtime looks for 'handler' at module level
__all__ = ['handler']
