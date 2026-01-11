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

class OnboardingUpdate(BaseModel):
    step: Optional[int] = None
    completed: Optional[bool] = None
    business_type: Optional[str] = None
    store_name: Optional[str] = None
    store_address: Optional[str] = None
    store_phone: Optional[str] = None


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Joriy foydalanuvchi profili va tenant ma'lumotlari"""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    
    # Import permissions
    from app.core.permissions import get_role_permissions, get_role_label
    
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if current_user.role else None,
            "role_label": get_role_label(current_user.role) if current_user.role else None,
            "permissions": get_role_permissions(current_user.role) if current_user.role else [],
            "user_settings": current_user.user_settings or {}
        },
        "tenant": {
            "id": tenant.id if tenant else None,
            "name": tenant.name if tenant else None,
            "business_type": tenant.business_type.value if tenant and tenant.business_type else None,
            "base_currency": tenant.base_currency if tenant else "UZS",
            "usd_to_uzs_rate": tenant.usd_to_uzs_rate if tenant else 12800.0,
            "address": tenant.address if tenant else None,
            "phone": tenant.phone if tenant else None,
            "config": tenant.config or {} if tenant else {},
            "onboarding_completed": tenant.onboarding_completed if tenant else False,
            "onboarding_step": tenant.onboarding_step if tenant else 0,
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


@router.patch("/onboarding")
async def update_onboarding(
    update_data: OnboardingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboarding holatini yangilash"""
    from app.models.tenant import BusinessType
    
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    # Update onboarding step
    if update_data.step is not None:
        tenant.onboarding_step = update_data.step
    
    # Update completed status
    if update_data.completed is not None:
        tenant.onboarding_completed = update_data.completed
    
    # Update business type
    if update_data.business_type is not None:
        try:
            tenant.business_type = BusinessType(update_data.business_type.lower())
        except ValueError:
            pass  # Keep existing if invalid
    
    # Update store info
    if update_data.store_name is not None:
        tenant.name = update_data.store_name
    if update_data.store_address is not None:
        tenant.address = update_data.store_address
    if update_data.store_phone is not None:
        tenant.phone = update_data.store_phone
    
    db.commit()
    db.refresh(tenant)
    
    return {
        "success": True,
        "onboarding_step": tenant.onboarding_step,
        "onboarding_completed": tenant.onboarding_completed,
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "business_type": tenant.business_type.value if tenant.business_type else None,
            "address": tenant.address,
            "phone": tenant.phone,
        }
    }
