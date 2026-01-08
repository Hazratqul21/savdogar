from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.api import deps
from app.models import Supplier, User

router = APIRouter()

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    bank_details: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    name: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[SupplierResponse])
def read_suppliers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List suppliers."""
    return db.query(Supplier).offset(skip).limit(limit).all()

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    *,
    db: Session = Depends(deps.get_db),
    supplier_in: SupplierCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create supplier."""
    supplier = Supplier(**supplier_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/{id}", response_model=SupplierResponse)
def read_supplier(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get supplier by ID."""
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{id}", response_model=SupplierResponse)
def update_supplier(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    supplier_in: SupplierUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{id}")
def delete_supplier(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted"}
