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
from app.models.user import UserRole

router = APIRouter(tags=["authentication"])

# Note: OPTIONS handlers are handled by the global handler in main.py
# These explicit handlers are kept as backup but may not be reached
# if the global handler catches them first

@router.post(
    "/signup",
    response_model=user_schema.User,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new user account. This is a public endpoint.",
    response_description="User created successfully",
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "User already exists or validation failed"},
        500: {"description": "Internal server error"},
    }
)
async def signup(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
) -> Any:
    """
    Register a new user (public endpoint)
    
    This endpoint allows new users to register.
    Returns 201 Created on success, 400 Bad Request if user already exists.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"✅ POST /api/v1/auth/signup called - username={user_in.username}, email={user_in.email}, business_type={getattr(user_in, 'business_type', None)}")
    
    try:
        # Check if user with email exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu email bilan foydalanuvchi allaqachon mavjud.",
            )
        
        # Check if user with username exists
        user = db.query(User).filter(User.username == user_in.username).first()
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu username bilan foydalanuvchi allaqachon mavjud.",
            )
        
        # Check if user with phone number exists (if provided)
        if user_in.phone_number:
            user = db.query(User).filter(User.phone_number == user_in.phone_number).first()
            if user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu telefon raqami bilan foydalanuvchi allaqachon mavjud.",
                )
        
        # Handle tenant creation if business_type is provided
        tenant_id = None
        if hasattr(user_in, 'business_type') and user_in.business_type:
            from app.models.tenant import Tenant, BusinessType
            
            # Normalize business_type to lowercase string
            business_type_str = user_in.business_type.lower()
            
            # Validate against allowed values
            valid_types = [e.value for e in BusinessType]
            if business_type_str not in valid_types:
                business_type_str = "retail"
                logger.warning(f"⚠️ Invalid business_type '{user_in.business_type}', using default: retail")
            
            # Create tenant automatically for new signup
            tenant_name = user_in.full_name or user_in.username or f"{user_in.email.split('@')[0]}'s Business"
            tenant_obj = Tenant(
                name=tenant_name,
                business_type=business_type_str,  # Store as lowercase string
                email=user_in.email,
                phone=user_in.phone_number,
                config={},
                subscription_plan="trial",
                max_users=5,
                max_branches=1,
                is_active=True,
            )
            db.add(tenant_obj)
            db.flush()  # Flush to get tenant ID
            tenant_id = tenant_obj.id
            logger.info(f"✅ Tenant created automatically: {tenant_name} (ID: {tenant_id}, business_type: {business_type_str})")
        
        # Create new user
        # ✅ FIX: First user of a tenant ALWAYS becomes owner
        # Ignore any role sent from frontend during signup
        user_role = "owner"  # Signup creates owner, team members get different roles via /team endpoint
        
        user_obj = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=security.get_password_hash(user_in.password),
            role=user_role,  # Store as lowercase string
            is_active=True,
            phone_number=user_in.phone_number,
            full_name=user_in.full_name,
            tenant_id=tenant_id,  # Assign to created tenant if any
        )
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
        
        logger.info(f"✅ User created successfully: {user_obj.username} (ID: {user_obj.id}, tenant_id: {tenant_id})")
        return user_obj
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        from app.core.exceptions import handle_database_error, handle_generic_error
        
        # Check if it's a database error (connection, timeout, SSL, etc.)
        error_msg = str(e).lower()
        db_error_keywords = [
            "connection", "timeout", "database", "could not connect",
            "ssl", "certificate", "supabase", "postgres", "psycopg",
            "operationalerror", "interfaceerror", "connectionpool",
            "relation", "table", "does not exist"
        ]
        
        if any(keyword in error_msg for keyword in db_error_keywords):
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
