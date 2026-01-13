from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from app.core.config import settings
import bcrypt
import logging

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password using bcrypt directly (not passlib).
    This avoids compatibility issues between passlib and bcrypt versions.
    """
    try:
        # Ensure both are bytes
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        
        # Use bcrypt directly
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt directly (not passlib).
    """
    try:
        # Encode password
        password_bytes = password.encode('utf-8')
        
        # Bcrypt supports passwords up to 72 bytes
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise
