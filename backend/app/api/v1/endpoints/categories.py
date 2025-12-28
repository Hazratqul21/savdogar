from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models import Category, User
from app.schemas import product as product_schema

router = APIRouter()

@router.get("/", response_model=List[product_schema.Category])
def read_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all categories."""
    categories = db.query(Category).offset(skip).limit(limit).all()
    return categories

@router.post("/", response_model=product_schema.Category)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: product_schema.CategoryCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create new category."""
    category = Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{id}", response_model=product_schema.Category)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    category_in: product_schema.CategoryUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update category."""
    category = db.query(Category).filter(Category.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{id}")
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete category."""
    category = db.query(Category).filter(Category.id == id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
