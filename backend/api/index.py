"""
Vercel Serverless Function Entry Point
=====================================
FastAPI + Mangum for Vercel Python runtime.
Mangum wraps ASGI apps for AWS Lambda / Vercel compatibility.

FORCE REBUILD: 2026-01-12T06:15:00Z
DEPLOY VERSION: v3.0.0
COMMIT: 4b7ba17
CRITICAL FIX: Tenant auto-create for products_v2
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

# Use Mangum for Lambda/Vercel compatibility
from mangum import Mangum

# Create Mangum handler - THIS is what Vercel will call
# lifespan="off" prevents issues with cold starts
handler = Mangum(app, lifespan="off")

# Also export app for local development
__all__ = ["handler", "app"]
