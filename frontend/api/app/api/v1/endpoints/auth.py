from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas import user as user_schema
from app.models import User

router = APIRouter()

@router.post("/signup", response_model=user_schema.User)
def signup(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
) -> Any:
    """
    Register a new user (public endpoint)
    """
    try:
        # Check if user with email exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="Bu email bilan foydalanuvchi allaqachon mavjud.",
            )
        
        # Check if user with username exists
        user = db.query(User).filter(User.username == user_in.username).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="Bu username bilan foydalanuvchi allaqachon mavjud.",
            )
        
        # Check if user with phone number exists (if provided)
        if user_in.phone_number:
            user = db.query(User).filter(User.phone_number == user_in.phone_number).first()
            if user:
                raise HTTPException(
                    status_code=400,
                    detail="Bu telefon raqami bilan foydalanuvchi allaqachon mavjud.",
                )
        
        user_obj = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=security.get_password_hash(user_in.password),
            role=user_in.role,
            is_active=True,
            phone_number=user_in.phone_number,
            full_name=user_in.full_name,
        )
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
        return user_obj
    except HTTPException:
        raise
    except Exception as e:
        from app.core.exceptions import handle_database_error, handle_generic_error
        
        # Check if it's a database error
        error_msg = str(e).lower()
        if "relation" in error_msg or "connection" in error_msg or "database" in error_msg:
            raise handle_database_error(e)
        
        # Generic error
        raise handle_generic_error(e, context="Ro'yxatdan o'tish")

@router.post("/login", response_model=user_schema.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    Supports login with username, email, or phone number
    
    ✅ SECURITY FIX: Constant-time lookup to prevent timing attacks
    """
    try:
        from sqlalchemy import or_
        
        # ✅ SECURITY FIX: Single query with OR conditions (constant time)
        # This prevents timing attacks by always executing the same query structure
        login_identifier = form_data.username.strip()
        
        user = db.query(User).filter(
            or_(
                User.username == login_identifier,
                User.email == login_identifier,
                User.phone_number == login_identifier
            )
        ).first()
        
        # ✅ SECURITY FIX: Always perform password verification to maintain constant time
        # This prevents attackers from detecting user existence via timing differences
        # Use a dummy hash if user not found to ensure constant verification time
        if not user:
            # Perform dummy password verification to maintain constant execution time
            # This prevents timing attacks that could reveal user existence
            dummy_hash = "$2b$12$dummy.hash.for.timing.attack.prevention.constant.time"
            security.verify_password("dummy_password_that_will_never_match", dummy_hash)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Noto'g'ri login, telefon raqami yoki parol"
            )
        
        # Verify password (always takes same time regardless of user existence)
        if not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Noto'g'ri login, telefon raqami yoki parol"
            )
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Foydalanuvchi faol emas")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "access_token": security.create_access_token(
                user.id, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except Exception as e:
        from app.core.exceptions import handle_database_error, handle_generic_error
        
        # Check if it's a database error (connection, timeout, SSL, etc.)
        error_msg = str(e).lower()
        db_error_keywords = [
            "connection", "timeout", "database", "could not connect",
            "ssl", "certificate", "supabase", "postgres", "psycopg",
            "operationalerror", "interfaceerror", "connectionpool"
        ]
        
        if any(keyword in error_msg for keyword in db_error_keywords):
            raise handle_database_error(e)
        
        # Generic error
        raise handle_generic_error(e, context="Kirish")

@router.get("/me", response_model=user_schema.User)
def get_current_user_info(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current authenticated user information
    """
    return current_user
