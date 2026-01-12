"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime.
Vercel natively supports ASGI apps like FastAPI.

DEPLOY: 2026-01-12T19:58:00Z
VERSION: v3.2.0
FIX: Remove Mangum wrapper - Vercel supports ASGI natively
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import FastAPI app - Vercel will use this directly
from app.main import app

# Export app as handler for Vercel
handler = app
