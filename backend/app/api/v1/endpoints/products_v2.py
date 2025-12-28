from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import User
from app.models.product_v2 import ProductV2, ProductVariant, ProductType
from app.models.pricing import PriceTier
from app.schemas import product_v2 as schemas

router = APIRouter()

@router.post("/", response_model=schemas.Product)
def create_product(
    *,
    db: Session = Depends(deps.get_db),
    product_in: schemas.ProductCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Yangi mahsulot yaratish
    Agar type = VARIABLE bo'lsa, variantlar avtomatik yaratiladi
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Foydalanuvchi tenant ga bog'lanmagan"
        )
    
    # Product yaratish
    product_obj = ProductV2(
        tenant_id=current_user.tenant_id,
        name=product_in.name,
        description=product_in.description,
        category_id=product_in.category_id,
        type=product_in.type,
        base_price=product_in.base_price,
        cost_price=product_in.cost_price or product_in.base_price,
        tax_rate=product_in.tax_rate or 0.0,
        product_metadata=product_in.product_metadata or {},
        is_active=True,
    )
    db.add(product_obj)
    db.flush()  # ID ni olish uchun
    
    # Variantlar yaratish
    if product_in.type == ProductType.VARIABLE and product_in.variants:
        for variant_data in product_in.variants:
            variant_obj = ProductVariant(
                product_id=product_obj.id,
                tenant_id=current_user.tenant_id,
                sku=variant_data.sku,
                price=variant_data.price or product_in.base_price,
                cost_price=variant_data.cost_price or product_in.cost_price or product_in.base_price,
                stock_quantity=variant_data.stock_quantity,
                min_stock_level=variant_data.min_stock_level or 0.0,
                max_stock_level=variant_data.max_stock_level,
                attributes=variant_data.attributes or {},
                barcode_aliases=variant_data.barcode_aliases or [],
                is_active=variant_data.is_active,
            )
            db.add(variant_obj)
    elif product_in.type == ProductType.SIMPLE:
        # Simple product uchun bitta variant yaratish
        variant_obj = ProductVariant(
            product_id=product_obj.id,
            tenant_id=current_user.tenant_id,
            sku=f"{product_in.name.upper().replace(' ', '-')}-001",
            price=product_in.base_price,
            cost_price=product_in.cost_price or product_in.base_price,
            stock_quantity=0.0,
            attributes={},
            barcode_aliases=[],
            is_active=True,
        )
        db.add(variant_obj)
    
    db.commit()
    db.refresh(product_obj)
    
    # Variantlarni yuklash
    product_obj.variants = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_obj.id
    ).all()
    
    return product_obj

@router.get("/", response_model=List[schemas.Product])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulotlarni olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    products = db.query(ProductV2).filter(
        ProductV2.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    
    # Variantlarni yuklash
    for product in products:
        product.variants = db.query(ProductVariant).filter(
            ProductVariant.product_id == product.id
        ).all()
    
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta mahsulotni olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    product.variants = db.query(ProductVariant).filter(
        ProductVariant.product_id == product.id
    ).all()
    
    return product

@router.post("/variants/{variant_id}/price-tiers", response_model=schemas.PriceTier)
def create_price_tier(
    *,
    db: Session = Depends(deps.get_db),
    variant_id: int,
    tier_in: schemas.PriceTierCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Narx darajasi yaratish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Variantni tekshirish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == variant_id,
            ProductVariant.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    tier_obj = PriceTier(
        variant_id=variant_id,
        tenant_id=current_user.tenant_id,
        tier_type=tier_in.tier_type,
        min_quantity=tier_in.min_quantity,
        max_quantity=tier_in.max_quantity,
        price=tier_in.price,
        customer_group=tier_in.customer_group,
    )
    db.add(tier_obj)
    db.commit()
    db.refresh(tier_obj)
    
    return tier_obj








