import os
from app.main import app

# Vercel Serverless Function Entrypoint
# This allows Vercel to serve the FastAPI app
# It explicitly exposes the 'app' object
