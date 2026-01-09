"""
Vercel Serverless Function Entrypoint for FastAPI
Uses Mangum to convert FastAPI ASGI app to AWS Lambda/API Gateway format
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory (frontend/api) to Python path for imports
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from mangum import Mangum
from app.main import app

# Create Mangum handler for Vercel serverless functions
# lifespan="off" because Vercel handles function lifecycle
# Vercel routes /api/* to this handler and passes full path including /api prefix
# FastAPI app has routes at /api/v1/*, so paths should match correctly
handler = Mangum(
    app, 
    lifespan="off",
    text_mime_types=["application/json", "text/plain", "application/x-www-form-urlencoded"],
    # Enable CORS preflight handling
    enable_lifespan=False,
    # Explicitly handle all HTTP methods including OPTIONS
    api_gateway_base_path="",
)

logger.info("Mangum handler initialized for Vercel serverless functions")
