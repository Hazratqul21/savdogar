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
            # CRITICAL: Log full event structure for debugging
            logger.info(f"🔍 Full event structure: {list(event.keys())}")
            logger.info(f"🔍 Event content: {event}")
            
            # CRITICAL: Vercel event format handling
            # For Vercel Python runtime with ASGI (Mangum), the event structure might vary
            # Try multiple locations for path extraction
            path = None
            
            # Method 1: Try direct path field (AWS API Gateway format)
            if "path" in event and event["path"]:
                path = event["path"]
            
            # Method 2: Try rawPath (AWS API Gateway v2 format)
            if not path and "rawPath" in event and event["rawPath"]:
                path = event["rawPath"]
            
            # Method 3: Try extracting from url field (Vercel might use this)
            if not path and "url" in event:
                from urllib.parse import urlparse
                try:
                    url_obj = urlparse(event["url"])
                    path = url_obj.path
                except Exception:
                    pass
            
            # Method 4: Try requestContext (AWS API Gateway format)
            if not path and "requestContext" in event:
                req_ctx = event["requestContext"]
                if isinstance(req_ctx, dict):
                    if "path" in req_ctx and req_ctx["path"]:
                        path = req_ctx["path"]
                    elif "http" in req_ctx and isinstance(req_ctx["http"], dict):
                        if "path" in req_ctx["http"] and req_ctx["http"]["path"]:
                            path = req_ctx["http"]["path"]
                        # Also try path from resourcePath
                        if not path and "resourcePath" in req_ctx:
                            path = req_ctx["resourcePath"]
            
            # Method 5: Try headers (some proxies pass path in headers)
            if not path and "headers" in event:
                headers = event["headers"]
                if isinstance(headers, dict):
                    # Try x-request-path or similar headers
                    if "x-request-path" in headers:
                        path = headers["x-request-path"]
                    elif "x-path" in headers:
                        path = headers["x-path"]
                    # Try extracting from referer or origin
                    elif "referer" in headers:
                        try:
                            from urllib.parse import urlparse
                            url_obj = urlparse(headers["referer"])
                            path = url_obj.path
                        except Exception:
                            pass
            
            # Method 6: Try queryStringParameters (unlikely but possible)
            if not path and "queryStringParameters" in event:
                qsp = event["queryStringParameters"]
                if isinstance(qsp, dict) and "path" in qsp:
                    path = qsp["path"]
            
            # Default to "/" if path not found
            if not path:
                path = "/"
            
            # Extract method from various possible locations
            method = (
                event.get("httpMethod") or 
                (event.get("requestContext", {}) or {}).get("http", {}).get("method") if isinstance(event.get("requestContext"), dict) else None or
                (event.get("requestContext", {}) or {}).get("httpMethod") if isinstance(event.get("requestContext"), dict) else None or
                event.get("method") or
                "GET"
            )
            
            # Normalize path: ensure it starts with /
            if path and not path.startswith("/"):
                path = f"/{path}"
            
            logger.info(f"📥 Raw request (before normalization): {method} {path}")
            logger.info(f"📥 Event keys: {list(event.keys())}")
            
            # CRITICAL: Vercel routing with pattern "/api/v1/(.*)" behavior
            # Case 1: Full path already includes /api/v1 -> use as-is
            # Case 2: Path is only the matched part (e.g., "auth/signup") -> reconstruct
            # Case 3: Path is partial (e.g., "/auth/signup") -> reconstruct
            
            # Check if path already has /api/v1 prefix (case 1)
            has_api_v1_prefix = path.startswith("/api/v1")
            
            # Check if this is a special path that shouldn't be modified
            is_special_path = (
                path == "/" or
                path.startswith("/health") or
                path.startswith("/docs") or
                path.startswith("/redoc") or
                path == "/openapi.json" or
                path.startswith("/verify")
            )
            
            # Only reconstruct if:
            # 1. Path doesn't already have /api/v1 prefix
            # 2. It's not a special path
            # 3. It's not root
            if not has_api_v1_prefix and not is_special_path and path != "/":
                # Reconstruct full path: /api/v1/{matched_part}
                # Remove leading / if present, then add /api/v1/
                matched_part = path.lstrip("/")
                path = f"/api/v1/{matched_part}"
                logger.info(f"📥 Path reconstructed to: {path}")
            elif has_api_v1_prefix:
                logger.info(f"📥 Path already has /api/v1 prefix, using as-is: {path}")
            elif is_special_path:
                logger.info(f"📥 Special path, using as-is: {path}")
            
            # Ensure path and method are set in event for Mangum
            # Create a copy to avoid modifying original event structure
            import copy
            if isinstance(event, dict):
                try:
                    event_copy = copy.deepcopy(event)
                except Exception:
                    # If deep copy fails, use shallow copy
                    event_copy = event.copy()
            else:
                event_copy = dict(event) if event else {}
            
            # Set path and method at top level (AWS API Gateway format)
            event_copy["path"] = path
            event_copy["httpMethod"] = method.upper()
            
            # Ensure requestContext exists and has proper structure (AWS API Gateway HTTP API v2 format)
            if "requestContext" not in event_copy:
                event_copy["requestContext"] = {}
            
            # HTTP API v2 format
            if "http" not in event_copy["requestContext"]:
                event_copy["requestContext"]["http"] = {}
            event_copy["requestContext"]["http"]["method"] = method.upper()
            event_copy["requestContext"]["http"]["path"] = path
            
            # Also set for REST API format (backwards compatibility)
            event_copy["requestContext"]["httpMethod"] = method.upper()
            event_copy["requestContext"]["resourcePath"] = path
            
            # Extract query string if present (for Mangum)
            query_string = ""
            if "queryStringParameters" in event_copy and event_copy["queryStringParameters"]:
                from urllib.parse import urlencode
                query_string = urlencode(event_copy["queryStringParameters"])
            event_copy["queryStringParameters"] = event_copy.get("queryStringParameters") or {}
            event_copy["multiValueQueryStringParameters"] = event_copy.get("multiValueQueryStringParameters") or {}
            
            # Set rawPath and pathParameters if needed
            if "rawPath" not in event_copy:
                event_copy["rawPath"] = path
            
            # Ensure headers exist
            if "headers" not in event_copy:
                event_copy["headers"] = {}
            
            # Ensure body exists
            if "body" not in event_copy:
                event_copy["body"] = None
            
            # Set isBase64Encoded if needed
            if "isBase64Encoded" not in event_copy:
                event_copy["isBase64Encoded"] = False
            
            logger.info(f"📥 Normalized path: {event_copy.get('httpMethod')} {event_copy.get('path')}")
            logger.info(f"📥 RequestContext: {event_copy.get('requestContext', {}).keys()}")
            
            # Call original Mangum handler with normalized event
            response = original_handler(event_copy, context)
            
            # Ensure response is a dict
            if not isinstance(response, dict):
                response = {
                    "statusCode": 200,
                    "body": str(response),
                    "headers": {"Content-Type": "text/plain"}
                }
            
            # Add CORS headers if not present
            if "headers" not in response:
                response["headers"] = {}
            response["headers"]["Access-Control-Allow-Origin"] = "*"
            response["headers"]["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
            response["headers"]["Access-Control-Allow-Headers"] = "*"
            
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
