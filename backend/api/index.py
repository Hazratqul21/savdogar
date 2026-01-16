"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime with Mangum adapter.

DEPLOY: 2026-01-16T05:50:00Z
VERSION: v3.4.0 - CRITICAL FIX: 405 Method Not Allowed
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

# Import Mangum adapter for Vercel serverless function
from mangum import Mangum

# Create handler with Mangum
# lifespan="off" to avoid issues with Vercel cold starts
handler = Mangum(app, lifespan="off")

# Export both for compatibility
__all__ = ['app', 'handler']
