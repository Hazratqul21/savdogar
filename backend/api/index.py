"""
Vercel Serverless Function Entry Point
=====================================
FastAPI ASGI handler for Vercel Python runtime.
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

# Vercel Python 4.x REQUIRES 'handler' variable for ASGI apps
# This is the CRITICAL export that Vercel looks for
handler = app
