"""
Vercel Serverless Function Entry Point
=====================================
FastAPI + Mangum for Vercel Python runtime.
Mangum wraps ASGI apps for AWS Lambda / Vercel compatibility.
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

# Use Mangum for Lambda/Vercel compatibility
from mangum import Mangum

# Create Mangum handler - THIS is what Vercel will call
# lifespan="off" prevents issues with cold starts
handler = Mangum(app, lifespan="off")

# Also export app for local development
__all__ = ["handler", "app"]
