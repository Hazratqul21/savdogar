import os
import sys

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app

# Vercel Serverless Function Entrypoint
# Vercel Python runtime requires 'handler' to be exported
handler = app
