from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.product_v2 import ProductV2, ProductVariant
from app.models.inventory import InventoryMovement, MovementType

router = APIRouter()

class MovementCreate(BaseModel):
    variant_id: int
    quantity: float
    movement_type: MovementType
    notes: Optional[str] = None

class MovementResponse(BaseModel):
    id: int
    variant_id: int
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
    """Create stock movement for a variant."""
    tenant_id = current_user.tenant_id
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == movement_in.variant_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    # Update variant stock
    if movement_in.movement_type == MovementType.IN:
        variant.stock_quantity = (variant.stock_quantity or 0) + movement_in.quantity
    elif movement_in.movement_type == MovementType.OUT:
        if (variant.stock_quantity or 0) < movement_in.quantity:
            # Check if negative stock is allowed in tenant config
            from app.models.tenant import Tenant
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not (tenant and tenant.config and tenant.config.get("allow_negative_stock")):
                raise HTTPException(status_code=400, detail="Omborda yetarli tovar yo'q")
        variant.stock_quantity = (variant.stock_quantity or 0) - movement_in.quantity
    else:  # ADJUST
        variant.stock_quantity = movement_in.quantity
    
    movement = InventoryMovement(
        # We need to update InventoryMovement model if it doesn't have variant_id
        # For now, let's assume it has it or we use back-compat
        variant_id=movement_in.variant_id,
        quantity=movement_in.quantity,
        movement_type=movement_in.movement_type,
        reference_type="adjustment",
        notes=movement_in.notes,
        created_by=current_user.id,
        tenant_id=tenant_id
    )
    db.add(movement)
    db.add(variant)
    db.commit()
    db.refresh(movement)
    return movement

from sqlalchemy import and_

@router.get("/movements", response_model=List[MovementResponse])
def read_movements(
    db: Session = Depends(deps.get_db),
    variant_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List stock movements for current tenant."""
    tenant_id = current_user.tenant_id
    query = db.query(InventoryMovement).filter(InventoryMovement.tenant_id == tenant_id)
    if variant_id:
        query = query.filter(InventoryMovement.variant_id == variant_id)
    return query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/low-stock")
def get_low_stock(
    db: Session = Depends(deps.get_db),
    threshold: Optional[float] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get variants with low stock for current tenant."""
    tenant_id = current_user.tenant_id
    
    query = db.query(ProductVariant).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.is_active == True
        )
    )
    
    if threshold is not None:
        query = query.filter(ProductVariant.stock_quantity < threshold)
    else:
        # Use variant's own min_stock_level
        query = query.filter(ProductVariant.stock_quantity < ProductVariant.min_stock_level)
    
    variants = query.all()
    
    return [{
        "id": v.id,
        "name": v.product_v2.name if v.product_v2 else f"SKU: {v.sku}",
        "stock_quantity": v.stock_quantity,
        "unit": v.primary_unit,
        "sku": v.sku,
        "min_stock": v.min_stock_level
    } for v in variants]
