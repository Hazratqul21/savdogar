from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
import re
from app.models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    role: Optional[UserRole] = None  # Default None - will be set by backend

# Properties to receive via API on creation
class UserCreate(UserBase):
    username: str
    password: str
    email: EmailStr
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    business_type: Optional[str] = None  # For automatic tenant creation during signup
    role: Optional[UserRole] = None  # Signup sets None, backend assigns owner
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        ✅ SECURITY FIX: Enforce strong password requirements
        Prevents weak passwords vulnerable to brute-force attacks
        """
        if not v:
            raise ValueError("Parol bo'sh bo'lishi mumkin emas")
        
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        
        if not re.search(r'[A-Z]', v):
            raise ValueError("Parol kamida bitta katta harfni o'z ichiga olishi kerak")
        
        if not re.search(r'[a-z]', v):
            raise ValueError("Parol kamida bitta kichik harfni o'z ichiga olishi kerak")
        
        if not re.search(r'\d', v):
            raise ValueError("Parol kamida bitta raqamni o'z ichiga olishi kerak")
        
        # Optional: require special character (uncomment if needed)
        # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
        #     raise ValueError("Parol kamida bitta maxsus belgini o'z ichiga olishi kerak")
        
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        """
        ✅ SECURITY FIX: Enforce strong password requirements on update
        Only validates if password is provided (optional field)
        """
        if v is None:
            return v  # Password update is optional
        
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        
        if not re.search(r'[A-Z]', v):
            raise ValueError("Parol kamida bitta katta harfni o'z ichiga olishi kerak")
        
        if not re.search(r'[a-z]', v):
            raise ValueError("Parol kamida bitta kichik harfni o'z ichiga olishi kerak")
        
        if not re.search(r'\d', v):
            raise ValueError("Parol kamida bitta raqamni o'z ichiga olishi kerak")
        
        return v

class UserInDBBase(UserBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None  # JWT stores sub as string
    exp: Optional[int] = None  # Expiration timestamp
