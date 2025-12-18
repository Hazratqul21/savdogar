from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models import User, Organization, UserRole
from app.schemas import user as user_schema
from app.core import security
from app.core.config import settings
from app.core.database import get_db

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = user_schema.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_user_organization(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Optional[int]:
    """Get organization_id for current user. Returns None for super_admin."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return None  # Super admin can access all organizations
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400,
            detail="User is not assigned to any organization. Please contact administrator."
        )
    return current_user.organization_id

def require_organization(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> int:
    """Require organization_id. Even super_admin must specify organization for some operations."""
    if current_user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Super admin must specify organization_id in request"
        )
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400,
            detail="User is not assigned to any organization"
        )
    return current_user.organization_id
