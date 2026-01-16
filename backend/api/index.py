"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime (native ASGI support).

DEPLOY: 2026-01-16T06:00:00Z
VERSION: v3.5.0 - FIX: TypeError issubclass() - Direct ASGI export
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import FastAPI app
# Vercel Python runtime natively supports ASGI applications
# No need for Mangum adapter - direct export works
from app.main import app

# Vercel will automatically detect and use the ASGI app
# Export app directly for Vercel's native ASGI support
__all__ = ['app']
