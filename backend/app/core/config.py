from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings with validation."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Project Info
    PROJECT_NAME: str = "SmartPOS CRM"
    PROJECT_VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    
    # Database - Support both individual vars and full URL
    PGHOST: str = Field(default="localhost", description="PostgreSQL host")
    PGUSER: str = Field(default="postgres", description="PostgreSQL user")
    PGPORT: str = Field(default="5432", description="PostgreSQL port")
    PGPASSWORD: str = Field(default="postgres", description="PostgreSQL password")
    PGDATABASE: str = Field(default="pos_db", description="PostgreSQL database name")
    
    # Full database URL (takes precedence if set)
    DATABASE_URL: Optional[str] = Field(default=None, description="Full PostgreSQL connection URL")
    POSTGRES_URL: Optional[str] = Field(default=None, description="Alternative PostgreSQL URL env var")
    
    @property
    def database_url(self) -> str:
        """Construct database URL with SSL support for Azure."""
        # Use explicit URL if provided
        url = self.DATABASE_URL or self.POSTGRES_URL
        
        if not url:
            # Construct from individual components
            url = f"postgresql://{self.PGUSER}:{self.PGPASSWORD}@{self.PGHOST}:{self.PGPORT}/{self.PGDATABASE}"
        
        # Azure SSL fix
        if "azure.com" in (self.PGHOST or "") and "sslmode" not in (url or ""):
            if "?" in url:
                url += "&sslmode=require"
            else:
                url += "?sslmode=require"
        
        return url
    
    # Security - CRITICAL: SECRET_KEY is required in production
    SECRET_KEY: str = Field(
        default="",
        description="Secret key for JWT tokens. REQUIRED in production!"
    )
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Validate SECRET_KEY is set in production."""
        environment = info.data.get("ENVIRONMENT", "development")
        
        if environment == "production" and (not v or v == "" or "change_me" in v.lower() or "default" in v.lower()):
            raise ValueError(
                "SECRET_KEY must be set in production environment! "
                "Generate a strong random key (min 32 characters)."
            )
        
        if not v:
            # Development fallback (not secure, but convenient)
            return "dev-secret-key-change-in-production-min-32-chars"
        
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long for security")
        
        return v
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    FRONTEND_URL: Optional[str] = Field(
        default=None,
        description="Frontend URL for CORS. If not set, uses current domain in production."
    )
    CORS_ORIGINS: Optional[str] = Field(
        default=None,
        description="Comma-separated list of allowed CORS origins"
    )
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: str = Field(default="", description="Azure OpenAI endpoint")
    AZURE_OPENAI_API_KEY: str = Field(default="", description="Azure OpenAI API key")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = Field(default="gpt-4o", description="Azure OpenAI deployment name")
    AZURE_OPENAI_API_VERSION: str = Field(default="2024-02-15-preview", description="Azure OpenAI API version")
    
    # Redis Configuration (for rate limiting and caching)
    REDIS_URL: Optional[str] = Field(
        default=None,
        description="Redis connection URL (e.g., redis://localhost:6379/0 or redis://:password@host:6379/0)"
    )
    REDIS_HOST: str = Field(default="localhost", description="Redis host")
    REDIS_PORT: int = Field(default=6379, description="Redis port")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis password")
    REDIS_DB: int = Field(default=0, description="Redis database number")
    
    # File Storage Configuration
    STORAGE_TYPE: str = Field(
        default="local",
        description="Storage type: local, azure, s3"
    )
    UPLOAD_DIR: str = Field(default="/tmp/uploads", description="Directory for file uploads (local storage only)")
    
    # Azure Blob Storage Configuration
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = Field(
        default=None,
        description="Azure Storage connection string for blob storage"
    )
    AZURE_STORAGE_CONTAINER: str = Field(
        default="uploads",
        description="Azure Blob Storage container name"
    )
    
    # AWS S3 Configuration (optional)
    AWS_S3_BUCKET: Optional[str] = Field(default=None, description="AWS S3 bucket name")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, description="AWS access key ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, description="AWS secret access key")
    AWS_REGION: Optional[str] = Field(default="us-east-1", description="AWS region")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level: DEBUG, INFO, WARNING, ERROR")
    
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.ENVIRONMENT.lower() == "development"

settings = Settings()
