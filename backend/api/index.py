"""
Vercel Serverless Function Entry Point
=====================================
FastAPI ASGI handler for Vercel Python runtime.
Vercel natively supports ASGI apps without Mangum.
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import FastAPI app directly
# Vercel Python 4.x supports ASGI apps natively
from app.main import app

# Export app for Vercel ASGI support
# No Mangum needed - Vercel handles ASGI directly
