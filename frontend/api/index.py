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
