from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    user_settings: Optional[Dict[str, Any]] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    usd_to_uzs_rate: Optional[float] = None
    min_margin_percent: Optional[float] = None
    config: Optional[Dict[str, Any]] = None

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Joriy foydalanuvchi profili va tenant ma'lumotlari"""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "user_settings": current_user.user_settings or {}
        },
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "business_type": tenant.business_type,
            "base_currency": tenant.base_currency,
            "usd_to_uzs_rate": tenant.usd_to_uzs_rate,
            "config": tenant.config or {}
        }
    }

@router.patch("/profile")
async def update_profile(
    update_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Profilni yangilash"""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.phone_number is not None:
        current_user.phone_number = update_data.phone_number
    if update_data.user_settings is not None:
        current_user.user_settings = {**(current_user.user_settings or {}), **update_data.user_settings}
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/tenant")
async def update_tenant(
    update_data: TenantUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tashkilot sozlamalarini yangilash"""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    if update_data.name is not None:
        tenant.name = update_data.name
    if update_data.usd_to_uzs_rate is not None:
        tenant.usd_to_uzs_rate = update_data.usd_to_uzs_rate
    if update_data.min_margin_percent is not None:
        tenant.min_margin_percent = update_data.min_margin_percent
    if update_data.config is not None:
        tenant.config = {**(tenant.config or {}), **update_data.config}
    
    db.commit()
    db.refresh(tenant)
    return tenant
