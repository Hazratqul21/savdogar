"""
Vercel Serverless Function Entry Point
=====================================
FastAPI ASGI handler for Vercel Python runtime using Mangum adapter.
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import FastAPI app
from app.main import app

# Mangum adapter for AWS Lambda / Vercel
from mangum import Mangum

# Create handler with Mangum
# lifespan="off" to avoid issues with Vercel cold starts
handler = Mangum(app, lifespan="off")

# Export for Vercel
# Vercel will call handler(event, context)
__all__ = ['handler']
