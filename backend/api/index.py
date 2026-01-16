"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime.

DEPLOY: 2026-01-16T06:30:00Z
VERSION: v4.1.0 - SENIOR FIX: Proper ASGI handler for Vercel

IMPORTANT: Vercel @vercel/python looks for:
1. An ASGI/WSGI app named 'app'
2. A callable named 'handler' for HTTP functions

For FastAPI (ASGI), we export 'app' directly.
"""
import sys
import os

# Add backend directory to Python path FIRST - before any imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

# Ensure backend is in path
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Also add the parent of backend for absolute imports
REPO_ROOT = os.path.dirname(BACKEND_DIR)
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Set environment variables for Vercel
os.environ["VERCEL"] = "1"

# Now import FastAPI app
from app.main import app

# Vercel @vercel/python runtime will automatically detect
# that 'app' is an ASGI application and handle it correctly.
# No Mangum or other adapter needed for Vercel's Python runtime.

# Export for Vercel
__all__ = ['app']
