"""
Super Admin API Endpoints
For platform management and tenant administration
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.models import User
from app.models.tenant import Tenant
from app.schemas import tenant as tenant_schemas

router = APIRouter()


# ==================== Schemas ====================

class TenantStatusUpdate(BaseModel):
    is_active: bool


# ==================== Tenant Management ====================

@router.get("/tenants", response_model=List[tenant_schemas.Tenant])
def get_all_tenants(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_super_admin),
) -> Any:
    """
    Get all tenants (Super Admin only)
    """
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return tenants


@router.get("/tenants/{tenant_id}", response_model=tenant_schemas.Tenant)
def get_tenant_by_id(
    tenant_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_super_admin),
) -> Any:
    """
    Get tenant details by ID (Super Admin only)
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/tenants/{tenant_id}/status", response_model=tenant_schemas.Tenant)
def update_tenant_status(
    tenant_id: int,
    status_update: TenantStatusUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_super_admin),
) -> Any:
    """
    Update tenant status (activate/deactivate) - Super Admin only
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.is_active = status_update.is_active
    db.commit()
    db.refresh(tenant)
    
    return tenant
