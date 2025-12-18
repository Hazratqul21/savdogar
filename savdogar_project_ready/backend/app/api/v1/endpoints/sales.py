from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.models import Sale, SaleItem, Product, User, InventoryMovement, MovementType
from app.schemas import sale as sale_schema

router = APIRouter()

@router.post("/", response_model=sale_schema.SaleResponse)
def create_sale(
    *,
    db: Session = Depends(deps.get_db),
    sale_in: sale_schema.SaleCreate,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: int = Depends(deps.require_organization),
) -> Any:
    """Create a new sale (checkout)."""
    # Calculate totals
    total_amount = 0.0
    sale_items = []
    
    for item_data in sale_in.items:
        # Get product (must belong to same organization)
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.organization_id == organization_id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")
        
        # Check stock
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        
        # Calculate item total
        item_total = (item_data.price * item_data.quantity) - item_data.discount
        total_amount += item_total
        
        # Update stock
        product.stock_quantity -= item_data.quantity
        db.add(product)
        
        sale_items.append({
            "product_id": item_data.product_id,
            "quantity": item_data.quantity,
            "price": item_data.price,
            "total": item_total,
        })
    
    # Apply sale discount
    total_amount -= sale_in.discount
    
    # Create sale
    sale = Sale(
        cashier_id=current_user.id,
        organization_id=organization_id,
        total_amount=total_amount,
        payment_method=sale_in.payment_method,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    
    # Create sale items and inventory movements
    for item_data in sale_items:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            price=item_data["price"],
            total=item_data["total"],
        )
        db.add(sale_item)
        
        # Create inventory movement record for tracking
        inventory_movement = InventoryMovement(
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            movement_type=MovementType.OUT,
            reference_type="sale",
            reference_id=sale.id,
            notes=f"Sale #{sale.id}: {item_data['quantity']} units sold",
            created_by=current_user.id
        )
        db.add(inventory_movement)
    
    db.commit()
    db.refresh(sale)
    return sale

@router.get("/", response_model=List[sale_schema.SaleResponse])
def read_sales(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """List all sales."""
    query = db.query(Sale)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Sale.organization_id == organization_id)
    
    sales = query.offset(skip).limit(limit).all()
    return sales

@router.get("/{id}", response_model=sale_schema.SaleResponse)
def read_sale(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Get sale by ID."""
    query = db.query(Sale).filter(Sale.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Sale.organization_id == organization_id)
    
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.get("/{id}/receipt", response_model=sale_schema.Receipt)
def get_receipt(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Get receipt for a sale."""
    query = db.query(Sale).filter(Sale.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Sale.organization_id == organization_id)
    
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Build receipt
    items = []
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items.append({
            "name": product.name if product else "Unknown",
            "quantity": item.quantity,
            "price": item.price,
            "total": item.total,
        })
    
    cashier = db.query(User).filter(User.id == sale.cashier_id).first()
    
    return sale_schema.Receipt(
        sale_id=sale.id,
        cashier_name=cashier.username if cashier else "Unknown",
        items=items,
        subtotal=sale.total_amount,
        discount=0,
        total=sale.total_amount,
        payment_method=sale.payment_method.value,
        created_at=sale.created_at.isoformat(),
    )

@router.post("/{id}/refund")
def refund_sale(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Refund a sale (restore stock)."""
    query = db.query(Sale).filter(Sale.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Sale.organization_id == organization_id)
    
    sale = query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Restore stock
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
            db.add(product)
    
    # Delete sale items and sale
    for item in sale.items:
        db.delete(item)
    db.delete(sale)
    db.commit()
    
    return {"message": "Sale refunded successfully"}
