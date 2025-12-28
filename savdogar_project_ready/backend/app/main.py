from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.v1.endpoints.receipts import public_router
from app.middleware.rate_limit import RateLimitMiddleware

app = FastAPI(title="SmartPOS CRM API", version="1.0.0")

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://savdogar-kt7z.vercel.app",  # Frontend
        "https://savdogar-otjp.vercel.app",  # Docs
        "http://localhost:3000",  # Local development
        "http://localhost:3001",  # Local development alternative
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(public_router, prefix="/verify", tags=["public"])

@app.get("/health")
def health_check():
    """Enhanced health check with system info."""
    from datetime import datetime
    from app.services.cache import get_cache_stats
    from app.middleware.rate_limit import get_rate_limit_stats
    
    return {
        "status": "healthy",
        "service": "SmartPOS CRM Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "cache": get_cache_stats(),
        "rate_limit": get_rate_limit_stats(),
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartPOS CRM API"}
