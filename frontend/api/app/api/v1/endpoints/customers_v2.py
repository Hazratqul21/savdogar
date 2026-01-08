from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import User
from app.models.customer_v2 import CustomerV2, CustomerLedger
from app.schemas import customer_v2 as schemas

router = APIRouter()

@router.post("/", response_model=schemas.Customer)
def create_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_in: schemas.CustomerCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Yangi mijoz yaratish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    customer_obj = CustomerV2(
        tenant_id=current_user.tenant_id,
        name=customer_in.name,
        phone=customer_in.phone,
        email=customer_in.email,
        address=customer_in.address,
        price_tier=customer_in.price_tier,
        credit_limit=customer_in.credit_limit or 0.0,
        max_debt_allowed=customer_in.max_debt_allowed or 0.0,
        customer_metadata=customer_in.customer_metadata or {},
        balance=0.0,
        loyalty_points=0.0,
    )
    db.add(customer_obj)
    db.commit()
    db.refresh(customer_obj)
    
    return customer_obj

@router.get("/", response_model=List[schemas.Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mijozlarni olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    customers = db.query(CustomerV2).filter(
        CustomerV2.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    
    return customers

@router.get("/{customer_id}/ledger", response_model=List[schemas.CustomerLedgerEntry])
def read_customer_ledger(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mijoz qarz kitobini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Mijozni tekshirish
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    ledger = db.query(CustomerLedger).filter(
        CustomerLedger.customer_id == customer_id
    ).order_by(CustomerLedger.created_at.desc()).all()
    
    return ledger








