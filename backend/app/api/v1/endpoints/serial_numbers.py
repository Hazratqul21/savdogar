"""
Serial Number Management API Endpoints
✅ PART 2: Plumbing & HVAC - Serial number tracking for boilers, equipment
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, datetime, timedelta

from app.api import deps
from app.models import User
from app.models.serial_number import SerialNumber
from app.models.product_v2 import ProductVariant
from app.schemas import serial_number as schemas

router = APIRouter()

@router.post("/", response_model=schemas.SerialNumber)
def create_serial_number(
    *,
    db: Session = Depends(deps.get_db),
    serial_in: schemas.SerialNumberCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bitta serial number yaratish
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Variantni tekshirish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == serial_in.variant_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    if not variant.requires_serial_number:
        raise HTTPException(
            status_code=400,
            detail="Bu variant serial number talab qilmaydi"
        )
    
    # Serial number uniqueness tekshirish (tenant ichida)
    existing = db.query(SerialNumber).filter(
        and_(
            SerialNumber.tenant_id == tenant_id,
            SerialNumber.serial_number == serial_in.serial_number,
            SerialNumber.is_active == True
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Serial number '{serial_in.serial_number}' allaqachon mavjud"
        )
    
    # Serial number yaratish
    serial_obj = SerialNumber(
        tenant_id=tenant_id,
        variant_id=serial_in.variant_id,
        serial_number=serial_in.serial_number,
        manufacturer_serial=serial_in.manufacturer_serial,
        batch_number=serial_in.batch_number,
        notes=serial_in.notes,
        is_active=True,
        is_sold=False,
        is_installed=False,
    )
    
    db.add(serial_obj)
    db.commit()
    db.refresh(serial_obj)
    
    return serial_obj

@router.post("/bulk", response_model=List[schemas.SerialNumber])
def create_serial_numbers_bulk(
    *,
    db: Session = Depends(deps.get_db),
    bulk_in: schemas.SerialNumberBulkCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Ko'p serial numberlarni bir vaqtda yaratish (shipment uchun)
    Masalan: 50 ta Ariston boiler uchun serial numberlar
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Variantni tekshirish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == bulk_in.variant_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    if not variant.requires_serial_number:
        raise HTTPException(
            status_code=400,
            detail="Bu variant serial number talab qilmaydi"
        )
    
    created_serials = []
    errors = []
    
    for serial_num in bulk_in.serial_numbers:
        # Uniqueness tekshirish
        existing = db.query(SerialNumber).filter(
            and_(
                SerialNumber.tenant_id == tenant_id,
                SerialNumber.serial_number == serial_num,
                SerialNumber.is_active == True
            )
        ).first()
        
        if existing:
            errors.append(f"Serial '{serial_num}' allaqachon mavjud")
            continue
        
        serial_obj = SerialNumber(
            tenant_id=tenant_id,
            variant_id=bulk_in.variant_id,
            serial_number=serial_num,
            batch_number=bulk_in.batch_number,
            notes=bulk_in.notes,
            is_active=True,
            is_sold=False,
            is_installed=False,
        )
        
        db.add(serial_obj)
        created_serials.append(serial_obj)
    
    if errors:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Ba'zi serial numberlar yaratilmadi: {', '.join(errors)}"
        )
    
    db.commit()
    
    # Refresh all created serials
    for serial in created_serials:
        db.refresh(serial)
    
    return created_serials

@router.get("/", response_model=List[schemas.SerialNumber])
def read_serial_numbers(
    db: Session = Depends(deps.get_db),
    variant_id: Optional[int] = None,
    is_sold: Optional[bool] = None,
    is_installed: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Serial numberlarni olish (filtering bilan)
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    query = db.query(SerialNumber).filter(
        SerialNumber.tenant_id == tenant_id
    )
    
    if variant_id:
        query = query.filter(SerialNumber.variant_id == variant_id)
    
    if is_sold is not None:
        query = query.filter(SerialNumber.is_sold == is_sold)
    
    if is_installed is not None:
        query = query.filter(SerialNumber.is_installed == is_installed)
    
    serials = query.order_by(SerialNumber.created_at.desc()).offset(skip).limit(limit).all()
    
    return serials

@router.get("/{serial_id}", response_model=schemas.SerialNumber)
def read_serial_number(
    *,
    db: Session = Depends(deps.get_db),
    serial_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bitta serial numberni olish
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    serial = db.query(SerialNumber).filter(
        and_(
            SerialNumber.id == serial_id,
            SerialNumber.tenant_id == tenant_id
        )
    ).first()
    
    if not serial:
        raise HTTPException(status_code=404, detail="Serial number topilmadi")
    
    return serial

@router.put("/{serial_id}", response_model=schemas.SerialNumber)
def update_serial_number(
    *,
    db: Session = Depends(deps.get_db),
    serial_id: int,
    serial_in: schemas.SerialNumberUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Serial numberni yangilash
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    serial = db.query(SerialNumber).filter(
        and_(
            SerialNumber.id == serial_id,
            SerialNumber.tenant_id == tenant_id
        )
    ).first()
    
    if not serial:
        raise HTTPException(status_code=404, detail="Serial number topilmadi")
    
    # Update fields
    if serial_in.serial_number is not None:
        # Check uniqueness if changing serial number
        existing = db.query(SerialNumber).filter(
            and_(
                SerialNumber.tenant_id == tenant_id,
                SerialNumber.serial_number == serial_in.serial_number,
                SerialNumber.id != serial_id,
                SerialNumber.is_active == True
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu serial number allaqachon mavjud")
        serial.serial_number = serial_in.serial_number
    
    if serial_in.warranty_start_date is not None:
        serial.warranty_start_date = serial_in.warranty_start_date
        if serial_in.warranty_duration_months:
            serial.warranty_duration_months = serial_in.warranty_duration_months
            # Calculate warranty end date
            try:
                from dateutil.relativedelta import relativedelta
                serial.warranty_end_date = serial_in.warranty_start_date + relativedelta(months=serial_in.warranty_duration_months)
            except ImportError:
                # Fallback if dateutil not available
                from datetime import timedelta
                # Approximate: 30 days per month
                days = serial_in.warranty_duration_months * 30
                serial.warranty_end_date = serial_in.warranty_start_date + timedelta(days=days)
    
    if serial_in.installation_date is not None:
        serial.installation_date = serial_in.installation_date
        serial.is_installed = True
    
    if serial_in.installation_address is not None:
        serial.installation_address = serial_in.installation_address
    
    if serial_in.installer_name is not None:
        serial.installer_name = serial_in.installer_name
    
    if serial_in.installer_phone is not None:
        serial.installer_phone = serial_in.installer_phone
    
    if serial_in.is_sold is not None:
        serial.is_sold = serial_in.is_sold
    
    if serial_in.is_installed is not None:
        serial.is_installed = serial_in.is_installed
    
    if serial_in.notes is not None:
        serial.notes = serial_in.notes
    
    db.commit()
    db.refresh(serial)
    
    return serial

@router.get("/variant/{variant_id}/available", response_model=List[schemas.SerialNumber])
def get_available_serial_numbers(
    *,
    db: Session = Depends(deps.get_db),
    variant_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Sotilmagan serial numberlarni olish (sale uchun)
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Variantni tekshirish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == variant_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    # Sotilmagan serial numberlar
    available = db.query(SerialNumber).filter(
        and_(
            SerialNumber.tenant_id == tenant_id,
            SerialNumber.variant_id == variant_id,
            SerialNumber.is_sold == False,
            SerialNumber.is_active == True
        )
    ).order_by(SerialNumber.serial_number).all()
    
    return available

