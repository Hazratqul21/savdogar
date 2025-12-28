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
        import traceback
        error_msg = str(e)
        print(f"Signup error: {error_msg}")
        print(traceback.format_exc())
        
        # Database connection error
        if "relation" in error_msg.lower() and "does not exist" in error_msg.lower():
            # Check if it's a specific table error
            if "users" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database jadvallari yaratilmagan. Iltimos, migration ni ishga tushiring: 'alembic upgrade head'"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Database jadvali topilmadi: {error_msg[:100]}"
                )
        elif "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database serverga ulanib bo'lmadi. Iltimos, keyinroq urinib ko'ring."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ro'yxatdan o'tishda xatolik yuz berdi: {error_msg[:100]}"
        )

@router.post("/login", response_model=user_schema.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    Supports login with username, email, or phone number
    """
    try:
        # Try to find user by username, email, or phone number
        login_identifier = form_data.username.strip()
        user = None
        
        # First try username
        user = db.query(User).filter(User.username == login_identifier).first()
        
        # If not found, try email
        if not user:
            user = db.query(User).filter(User.email == login_identifier).first()
        
        # If still not found, try phone number
        if not user:
            user = db.query(User).filter(User.phone_number == login_identifier).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Noto'g'ri login, telefon raqami yoki parol"
            )
        
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
        import traceback
        error_msg = str(e)
        print(f"Login error: {error_msg}")
        print(traceback.format_exc())
        
        # Database connection error
        if "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database serverga ulanib bo'lmadi. Iltimos, keyinroq urinib ko'ring."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server xatolik yuz berdi"
        )
