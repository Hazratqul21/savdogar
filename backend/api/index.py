"""
Vercel Serverless Function Entry Point
=====================================
Minimal handler for Vercel Python runtime.
"""
import sys
import os

# Add backend directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import FastAPI app and Mangum
from mangum import Mangum
from app.main import app

# Create Mangum handler for Vercel/AWS Lambda
handler = Mangum(app, lifespan="off")
