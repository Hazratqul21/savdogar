from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.models import User
from app.schemas import user as user_schema

router = APIRouter()

@router.get("/", response_model=List[user_schema.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Retrieve users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=user_schema.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create new user.
    """
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
        is_active=user_in.is_active,
        phone_number=user_in.phone_number,
        full_name=user_in.full_name,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj

@router.get("/me", response_model=user_schema.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
