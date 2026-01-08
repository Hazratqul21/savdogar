"""
Vercel Serverless Function Entrypoint for FastAPI
Uses Mangum to convert FastAPI ASGI app to AWS Lambda/API Gateway format
"""
import sys
import os

# Add backend directory to Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from mangum import Mangum
from app.main import app

# Create Mangum handler for Vercel serverless functions
# lifespan="off" because Vercel handles function lifecycle
handler = Mangum(app, lifespan="off")
