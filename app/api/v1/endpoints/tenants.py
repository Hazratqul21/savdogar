from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models import User
from app.models.tenant import Tenant
from app.schemas import tenant as schemas

router = APIRouter()

@router.post("/", response_model=schemas.Tenant)
def create_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_in: schemas.TenantCreate,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Yangi tenant yaratish (faqat admin)"""
    tenant_obj = Tenant(
        name=tenant_in.name,
        business_type=tenant_in.business_type,
        config=tenant_in.config or {},
        description=tenant_in.description,
        address=tenant_in.address,
        phone=tenant_in.phone,
        email=tenant_in.email,
        is_active=True,
    )
    db.add(tenant_obj)
    db.commit()
    db.refresh(tenant_obj)
    
    return tenant_obj

@router.get("/me", response_model=schemas.Tenant)
def read_tenant_me(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Joriy foydalanuvchi tenant ma'lumotlari"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.tenant_id
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    return tenant

@router.get("/", response_model=List[schemas.Tenant])
def read_tenants(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Barcha tenantlarni olish (faqat admin)"""
    tenants = db.query(Tenant).offset(skip).limit(limit).all()
    return tenants








