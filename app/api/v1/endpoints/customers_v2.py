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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    customer_obj = CustomerV2(
        tenant_id=tenant_id,
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    customers = db.query(CustomerV2).filter(
        CustomerV2.tenant_id == tenant_id
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Mijozni tekshirish
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    ledger = db.query(CustomerLedger).filter(
        CustomerLedger.customer_id == customer_id
    ).order_by(CustomerLedger.created_at.desc()).all()
    
    return ledger


@router.post("/{customer_id}/pay-debt", response_model=schemas.Customer)
def pay_customer_debt(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    amount: float,
    payment_method: str = "cash",
    notes: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mijoz qarzini to'lash"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="To'lov summasi musbat bo'lishi kerak")
    
    # Mijozni topish
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    current_debt = customer.current_debt or 0
    
    if amount > current_debt:
        raise HTTPException(
            status_code=400, 
            detail=f"To'lov summasi qarzdan ortiq. Joriy qarz: {current_debt}"
        )
    
    # Qarzni kamaytirish
    customer.current_debt = current_debt - amount
    
    # Ledger yozuvi
    ledger_entry = CustomerLedger(
        customer_id=customer_id,
        tenant_id=tenant_id,
        transaction_type="payment",
        amount=-amount,  # Minus - qarz kamaydi
        balance_after=customer.current_debt,
        description=f"Qarz to'lash ({payment_method})" + (f" - {notes}" if notes else ""),
        created_by=current_user.id,
    )
    db.add(ledger_entry)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.get("/{customer_id}", response_model=schemas.Customer)
def get_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta mijozni olish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    return customer


@router.patch("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    customer_in: schemas.CustomerUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mijozni yangilash"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mijozni o'chirish (soft delete)"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    customer = db.query(CustomerV2).filter(
        and_(
            CustomerV2.id == customer_id,
            CustomerV2.tenant_id == tenant_id
        )
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    
    # Soft delete
    customer.is_active = False
    db.commit()
    
    return {"message": "Mijoz o'chirildi", "deleted_id": customer_id}


@router.get("/debtors/list")
def get_debtors(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Qarzdorlar ro'yxati"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    debtors = db.query(CustomerV2).filter(
        and_(
            CustomerV2.tenant_id == tenant_id,
            CustomerV2.current_debt > 0,
            CustomerV2.is_active == True
        )
    ).order_by(CustomerV2.current_debt.desc()).all()
    
    total_debt = sum(c.current_debt or 0 for c in debtors)
    
    return {
        "total_debt": total_debt,
        "debtors_count": len(debtors),
        "debtors": [
            {
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "current_debt": c.current_debt,
                "credit_limit": c.credit_limit,
                "max_debt_allowed": c.max_debt_allowed,
            }
            for c in debtors
        ]
    }




