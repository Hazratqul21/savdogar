import os

class Settings:
    # Project Info
    PROJECT_NAME: str = "SmartPOS CRM"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database - STRICTLY from Env Vars
    # Vercel provides DATABASE_URL or POSTGRES_URL
    # Database - Support standard PG env vars or full URL
    PGHOST: str = os.getenv("PGHOST", "localhost")
    PGUSER: str = os.getenv("PGUSER", "postgres")
    PGPORT: str = os.getenv("PGPORT", "5432")
    PGPASSWORD: str = os.getenv("PGPASSWORD", "postgres")
    PGDATABASE: str = os.getenv("PGDATABASE", "pos_db")
    
    # Construct URL if DATABASE_URL or POSTGRES_URL is not explicitly set
    _default_db_url = f"postgresql://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}"
    DATABASE_URL: str = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or _default_db_url
    
    # Azure SSL fix
    if "azure.com" in (PGHOST or "") and "sslmode" not in (DATABASE_URL or ""):
         if "?" in DATABASE_URL:
             DATABASE_URL += "&sslmode=require"
         else:
             DATABASE_URL += "?sslmode=require"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_me_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    
    # File Uploads
    # In serverless, local file system is ephemeral. 
    # For now, we keep this but warn. Ideally should use S3/Blob.
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/tmp/uploads")

settings = Settings()
