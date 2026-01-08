from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.api import deps
from app.models import InventoryMovement, Product, User, MovementType

router = APIRouter()

class MovementCreate(BaseModel):
    product_id: int
    quantity: float
    movement_type: MovementType
    notes: Optional[str] = None

class MovementResponse(BaseModel):
    id: int
    product_id: int
    quantity: float
    movement_type: MovementType
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/movements", response_model=MovementResponse)
def create_movement(
    *,
    db: Session = Depends(deps.get_db),
    movement_in: MovementCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create stock movement."""
    product = db.query(Product).filter(Product.id == movement_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product stock
    if movement_in.movement_type == MovementType.IN:
        product.stock_quantity += movement_in.quantity
    elif movement_in.movement_type == MovementType.OUT:
        if product.stock_quantity < movement_in.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.stock_quantity -= movement_in.quantity
    else:  # ADJUST
        product.stock_quantity = movement_in.quantity
    
    movement = InventoryMovement(
        product_id=movement_in.product_id,
        quantity=movement_in.quantity,
        movement_type=movement_in.movement_type,
        reference_type="adjustment",
        notes=movement_in.notes,
        created_by=current_user.id,
    )
    db.add(movement)
    db.add(product)
    db.commit()
    db.refresh(movement)
    return movement

@router.get("/movements", response_model=List[MovementResponse])
def read_movements(
    db: Session = Depends(deps.get_db),
    product_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List stock movements."""
    query = db.query(InventoryMovement)
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    return query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/low-stock")
def get_low_stock(
    db: Session = Depends(deps.get_db),
    threshold: float = 10,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get products with low stock."""
    products = db.query(Product).filter(Product.stock_quantity < threshold).all()
    return [{
        "id": p.id,
        "name": p.name,
        "stock_quantity": p.stock_quantity,
        "unit": p.unit,
    } for p in products]
