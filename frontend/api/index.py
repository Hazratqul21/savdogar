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
    
    # Wrap handler to add logging and Vercel-specific path handling
    original_handler = handler
    
    def wrapped_handler(event, context):
        """Wrapped handler with request logging and Vercel path normalization"""
        try:
            # CRITICAL: Vercel event format handling
            # Vercel passes the full path in the event
            # Extract path and method
            path = event.get("path") or event.get("rawPath") or "/"
            method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
            
            logger.info(f"📥 Request received: {method} {path}")
            logger.info(f"📥 Event structure: {list(event.keys())}")
            
            # CRITICAL: Vercel routing passes full path like "/api/v1/auth/signup"
            # Mangum needs this in the "path" field
            if "path" not in event or not event.get("path"):
                # Try alternative field names
                if "rawPath" in event:
                    event["path"] = event["rawPath"]
                elif "pathParameters" in event:
                    params = event.get("pathParameters") or {}
                    if "proxy" in params:
                        # Reconstruct from proxy parameter
                        event["path"] = f"/api/v1/{params['proxy']}"
                    else:
                        # Default path
                        event["path"] = "/api/v1"
            
            # Ensure httpMethod is set
            if "httpMethod" not in event and method:
                event["httpMethod"] = method
            
            logger.info(f"📥 Normalized: {event.get('httpMethod')} {event.get('path')}")
            
            # Call original Mangum handler
            response = original_handler(event, context)
            
            # Log response
            status_code = response.get("statusCode", "unknown")
            logger.info(f"📤 Response: {status_code} for {method} {path}")
            
            return response
        except Exception as e:
            logger.error(f"❌ Handler error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Return proper error response
            return {
                "statusCode": 500,
                "body": f'{{"detail": "Internal server error: {str(e)}"}}',
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                }
            }
    
    handler = wrapped_handler
    
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
