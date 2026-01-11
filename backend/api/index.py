"""
Vercel Serverless Function Entry Point
=====================================
FastAPI ASGI handler for Vercel Python runtime.
Vercel Python 3.9+ supports ASGI natively.
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

# Vercel Python runtime expects 'app' variable for ASGI
# Alternative: Use 'handler' with Mangum (but causes timeouts)
# For native ASGI support, just export 'app'
