import os
from app.main import app

# Vercel Serverless Function Entrypoint
# Vercel Python runtime requires 'handler' to be exported
handler = app
