from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models import Product, Category, User
from app.schemas import product as product_schema
from app.services.ai_category_detector import detect_product_category

router = APIRouter()

@router.get("/", response_model=List[product_schema.Product])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: int = None,
    search: str = None,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """List products with optional filtering."""
    query = db.query(Product)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Product.organization_id == organization_id)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    products = query.offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=product_schema.Product)
def create_product(
    *,
    db: Session = Depends(deps.get_db),
    product_in: product_schema.ProductCreate,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: int = Depends(deps.require_organization),
) -> Any:
    """Create new product."""
    product_data = product_in.model_dump()
    product_data["organization_id"] = organization_id
    product = Product(**product_data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/{id}", response_model=product_schema.Product)
def read_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Get product by ID."""
    query = db.query(Product).filter(Product.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Product.organization_id == organization_id)
    
    product = query.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{id}", response_model=product_schema.Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    product_in: product_schema.ProductUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Update product."""
    query = db.query(Product).filter(Product.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Product.organization_id == organization_id)
    
    product = query.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{id}")
def delete_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Delete product."""
    query = db.query(Product).filter(Product.id == id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(Product.organization_id == organization_id)
    
    product = query.first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

@router.post("/generate-barcode")
def generate_barcode(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate a unique barcode."""
    barcode = str(uuid.uuid4().int)[:13]
    return {"barcode": barcode}

@router.post("/detect-category")
def detect_category(
    *,
    db: Session = Depends(deps.get_db),
    product_name: str = Query(..., description="Product name"),
    description: str = Query(None, description="Product description"),
    barcode: str = Query(None, description="Product barcode"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """AI-powered category detection for product."""
    try:
        result = detect_product_category(db, product_name, description, barcode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")
