from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import ssl
import os

# Database URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
print(f"[DATABASE] Connection URL configured (hidden for security)")

# SSL Configuration for Azure/Cloud
ssl_context = None
connect_args = {}

if "azure" in SQLALCHEMY_DATABASE_URL.lower() or "sslmode=require" in SQLALCHEMY_DATABASE_URL.lower():
    # Enforce SSL for Azure/Cloud
    print("[DATABASE] Cloud/Azure configuration detected. Enforcing SSL.")
    
    # If using psycopg2 (default), it handles sslmode=require in the URL usually.
    # But for explicit control or other drivers:
    if "sslmode" not in SQLALCHEMY_DATABASE_URL:
        connect_args["sslmode"] = "require"
        
    # Create default context if strict validation not possible without cert path
    # For serverless/Vercel, often simpler to trust CA or use system store
    if os.getenv("AZURE_CA_PATH"):
        ssl_context = ssl.create_default_context()
        ssl_context.load_verify_locations(os.getenv("AZURE_CA_PATH"))
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl_context"] = ssl_context

# Engine Creation with Serverless Optimizations
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,       # Critical for recovering from dropped connections
    pool_size=5,              # Small pool for serverless
    max_overflow=10,          # Allow bursts
    pool_recycle=300,         # Recycle persistent connections frequently (5 mins)
    pool_timeout=30           # Fail fast if pool is full
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to get DB session.
    Closes session automatically after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
