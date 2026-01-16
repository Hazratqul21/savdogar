"""
Warranty Management API Endpoints
✅ PART 2: Plumbing & HVAC - Warranty tracking and management
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.api import deps
from app.models import User
from app.models.warranty import Warranty, WarrantyStatus, WarrantyType
from app.models.serial_number import SerialNumber
from app.schemas import warranty as schemas

router = APIRouter()

@router.post("/", response_model=schemas.Warranty)
def create_warranty(
    *,
    db: Session = Depends(deps.get_db),
    warranty_in: schemas.WarrantyCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Warranty yaratish (serial number uchun)
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Serial numberni tekshirish
    serial = db.query(SerialNumber).filter(
        and_(
            SerialNumber.id == warranty_in.serial_number_id,
            SerialNumber.tenant_id == tenant_id
        )
    ).first()
    
    if not serial:
        raise HTTPException(status_code=404, detail="Serial number topilmadi")
    
    # Warranty number uniqueness (agar berilgan bo'lsa)
    if warranty_in.warranty_number:
        existing = db.query(Warranty).filter(
            and_(
                Warranty.tenant_id == tenant_id,
                Warranty.warranty_number == warranty_in.warranty_number
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu warranty number allaqachon mavjud")
    
    # Warranty end date hisoblash
    end_date = warranty_in.start_date + relativedelta(months=warranty_in.duration_months)
    
    # Warranty yaratish
    warranty_obj = Warranty(
        tenant_id=tenant_id,
        serial_number_id=warranty_in.serial_number_id,
        warranty_type=warranty_in.warranty_type,
        start_date=warranty_in.start_date,
        end_date=end_date,
        duration_months=warranty_in.duration_months,
        status=WarrantyStatus.ACTIVE,
        coverage_description=warranty_in.coverage_description,
        terms_and_conditions=warranty_in.terms_and_conditions,
        warranty_provider=warranty_in.warranty_provider,
        warranty_number=warranty_in.warranty_number,
        notes=warranty_in.notes,
    )
    
    db.add(warranty_obj)
    db.commit()
    db.refresh(warranty_obj)
    
    return warranty_obj

@router.get("/", response_model=List[schemas.Warranty])
def read_warranties(
    db: Session = Depends(deps.get_db),
    serial_number_id: Optional[int] = None,
    status: Optional[WarrantyStatus] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Warrantylarni olish (filtering bilan)
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    query = db.query(Warranty).filter(
        Warranty.tenant_id == tenant_id
    )
    
    if serial_number_id:
        query = query.filter(Warranty.serial_number_id == serial_number_id)
    
    if status:
        query = query.filter(Warranty.status == status)
    
    warranties = query.order_by(Warranty.created_at.desc()).offset(skip).limit(limit).all()
    
    return warranties

@router.get("/{warranty_id}", response_model=schemas.Warranty)
def read_warranty(
    *,
    db: Session = Depends(deps.get_db),
    warranty_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bitta warrantyni olish
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    warranty = db.query(Warranty).filter(
        and_(
            Warranty.id == warranty_id,
            Warranty.tenant_id == tenant_id
        )
    ).first()
    
    if not warranty:
        raise HTTPException(status_code=404, detail="Warranty topilmadi")
    
    return warranty

@router.put("/{warranty_id}", response_model=schemas.Warranty)
def update_warranty(
    *,
    db: Session = Depends(deps.get_db),
    warranty_id: int,
    warranty_in: schemas.WarrantyUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Warrantyni yangilash
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    warranty = db.query(Warranty).filter(
        and_(
            Warranty.id == warranty_id,
            Warranty.tenant_id == tenant_id
        )
    ).first()
    
    if not warranty:
        raise HTTPException(status_code=404, detail="Warranty topilmadi")
    
    # Update fields
    if warranty_in.status is not None:
        warranty.status = warranty_in.status
    
    if warranty_in.coverage_description is not None:
        warranty.coverage_description = warranty_in.coverage_description
    
    if warranty_in.terms_and_conditions is not None:
        warranty.terms_and_conditions = warranty_in.terms_and_conditions
    
    if warranty_in.claim_count is not None:
        warranty.claim_count = warranty_in.claim_count
    
    if warranty_in.last_claim_date is not None:
        warranty.last_claim_date = warranty_in.last_claim_date
    
    if warranty_in.notes is not None:
        warranty.notes = warranty_in.notes
    
    db.commit()
    db.refresh(warranty)
    
    return warranty

@router.get("/expiring/soon", response_model=List[schemas.Warranty])
def get_expiring_warranties(
    db: Session = Depends(deps.get_db),
    days: int = 30,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Tez orada muddati tugaydigan warrantylar
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    today = date.today()
    expiry_date = today + timedelta(days=days)
    
    warranties = db.query(Warranty).filter(
        and_(
            Warranty.tenant_id == tenant_id,
            Warranty.status == WarrantyStatus.ACTIVE,
            Warranty.end_date >= today,
            Warranty.end_date <= expiry_date
        )
    ).order_by(Warranty.end_date).all()
    
    return warranties






