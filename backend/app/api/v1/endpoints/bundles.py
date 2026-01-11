"""
Product Bundle/Kit Management API Endpoints
✅ PART 2: Plumbing & HVAC - Bundle/kit creation and management
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import User
from app.models.product_v2 import ProductV2, ProductVariant, ProductType
from app.models.product_bundle import ProductBundle
from app.schemas import bundle as schemas

router = APIRouter()

@router.post("/", response_model=List[schemas.BundleComponent])
def create_bundle(
    *,
    db: Session = Depends(deps.get_db),
    bundle_in: schemas.BundleCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bundle/Kit yaratish
    Masalan: "Heating System Kit" = 1 Boiler + 5 Radiators + 20m Pipe
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Productni tekshirish (BUNDLE type bo'lishi kerak)
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == bundle_in.product_id,
            ProductV2.tenant_id == tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    if product.type != ProductType.BUNDLE:
        raise HTTPException(
            status_code=400,
            detail="Bu mahsulot BUNDLE type emas. Avval mahsulotni BUNDLE type qiling."
        )
    
    # Componentlarni tekshirish va yaratish
    created_components = []
    
    for component_data in bundle_in.components:
        # Component variantni tekshirish
        variant = db.query(ProductVariant).filter(
            and_(
                ProductVariant.id == component_data.component_variant_id,
                ProductVariant.tenant_id == tenant_id
            )
        ).first()
        
        if not variant:
            raise HTTPException(
                status_code=404,
                detail=f"Component variant {component_data.component_variant_id} topilmadi"
            )
        
        # Component yaratish
        component_obj = ProductBundle(
            tenant_id=tenant_id,
            product_id=bundle_in.product_id,
            component_variant_id=component_data.component_variant_id,
            quantity=component_data.quantity,
            price_override=component_data.price_override,
            sequence=component_data.sequence,
            is_active=True,
        )
        
        db.add(component_obj)
        created_components.append(component_obj)
    
    db.commit()
    
    # Refresh all components
    for component in created_components:
        db.refresh(component)
    
    return created_components

@router.get("/product/{product_id}", response_model=List[schemas.BundleComponent])
def get_bundle_components(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bundle componentlarini olish
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Productni tekshirish
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    # Componentlarni olish
    components = db.query(ProductBundle).filter(
        and_(
            ProductBundle.product_id == product_id,
            ProductBundle.tenant_id == tenant_id,
            ProductBundle.is_active == True
        )
    ).order_by(ProductBundle.sequence).all()
    
    return components

@router.put("/component/{component_id}", response_model=schemas.BundleComponent)
def update_bundle_component(
    *,
    db: Session = Depends(deps.get_db),
    component_id: int,
    component_in: schemas.BundleComponentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bundle componentni yangilash
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    component = db.query(ProductBundle).filter(
        and_(
            ProductBundle.id == component_id,
            ProductBundle.tenant_id == tenant_id
        )
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component topilmadi")
    
    # Update fields
    if component_in.quantity is not None:
        component.quantity = component_in.quantity
    
    if component_in.price_override is not None:
        component.price_override = component_in.price_override
    
    if component_in.sequence is not None:
        component.sequence = component_in.sequence
    
    if component_in.is_active is not None:
        component.is_active = component_in.is_active
    
    db.commit()
    db.refresh(component)
    
    return component

@router.delete("/component/{component_id}")
def delete_bundle_component(
    *,
    db: Session = Depends(deps.get_db),
    component_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bundle componentni o'chirish
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    component = db.query(ProductBundle).filter(
        and_(
            ProductBundle.id == component_id,
            ProductBundle.tenant_id == tenant_id
        )
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component topilmadi")
    
    db.delete(component)
    db.commit()
    
    return {"message": "Component o'chirildi"}






