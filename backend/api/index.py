"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime.

DEPLOY: 2026-01-12T20:00:00Z
VERSION: v3.3.0
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import and re-export FastAPI app
# Vercel looks for 'app' variable for ASGI applications
from app.main import app
