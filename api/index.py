"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime.

DEPLOY: 2026-01-16T06:50:00Z
VERSION: v4.3.0 - FIX: Backend as Root Directory

Vercel Root Directory = "backend"
So this file is at: api/index.py (relative to backend/)
And app/ is at: app/ (relative to backend/)
"""
import sys
import os

# Get paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))  # api/
ROOT_DIR = os.path.dirname(CURRENT_DIR)                 # /

# Add root directory to Python path
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Set environment variables for Vercel
os.environ["VERCEL"] = "1"

# Import FastAPI app from backend/app/main.py
from app.main import app

# Export for Vercel - ASGI app
__all__ = ['app']
