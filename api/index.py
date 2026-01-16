"""
Vercel Serverless Function Entry Point
=====================================
FastAPI app for Vercel Python runtime.

DEPLOY: 2026-01-16T06:40:00Z
VERSION: v4.2.0 - FIX: Root level api/index.py structure

Vercel Python runtime expects:
- api/index.py at root level
- app/ directory at root level
- requirements.txt at root level
"""
import sys
import os

# Add current directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Set environment variables for Vercel
os.environ["VERCEL"] = "1"

# Import FastAPI app from root level app directory
from app.main import app

# Export for Vercel
__all__ = ['app']
