from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import User, UserRole
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Foydalanuvchi tenant yoki organizatsiyaga bog'lanmagan"
        )
    
    # Product yaratish
    product_obj = ProductV2(
        tenant_id=tenant_id,
        name=product_in.name,
        description=product_in.description,
        category_id=product_in.category_id,
        type=product_in.type,
        base_price=product_in.base_price,
        cost_price=product_in.cost_price or product_in.base_price,
        tax_rate=product_in.tax_rate or 0.0,
        product_metadata=product_in.product_metadata or {},
        is_active=True,
        # ✅ PART 2: Service item configuration
        service_duration_hours=product_in.service_duration_hours,
        service_category=product_in.service_category,
        linked_product_ids=product_in.linked_product_ids,
    )
    db.add(product_obj)
    db.flush()  # ID ni olish uchun
    
    # Variantlar yaratish
    if product_in.type == ProductType.VARIABLE and product_in.variants:
        for variant_data in product_in.variants:
            variant_obj = ProductVariant(
                product_id=product_obj.id,
                tenant_id=tenant_id,
                sku=variant_data.sku,
                price=variant_data.price or product_in.base_price,
                cost_price=variant_data.cost_price or product_in.cost_price or product_in.base_price,
                stock_quantity=variant_data.stock_quantity,
                min_stock_level=variant_data.min_stock_level or 0.0,
                max_stock_level=variant_data.max_stock_level,
                attributes=variant_data.attributes or {},
                barcode_aliases=variant_data.barcode_aliases or [],
                is_active=variant_data.is_active,
                # ✅ PART 2: Dual unit and serial number support
                primary_unit=variant_data.primary_unit or "piece",
                secondary_unit=variant_data.secondary_unit,
                unit_conversion_factor=variant_data.unit_conversion_factor,
                requires_serial_number=variant_data.requires_serial_number or False,
                is_serialized=variant_data.is_serialized or False,
            )
            db.add(variant_obj)
    elif product_in.type == ProductType.SIMPLE:
        # Simple product uchun bitta variant yaratish
        variant_obj = ProductVariant(
            product_id=product_obj.id,
            tenant_id=tenant_id,
            sku=f"{product_in.name.upper().replace(' ', '-')}-001",
            price=product_in.base_price,
            cost_price=product_in.cost_price or product_in.base_price,
            stock_quantity=0.0,
            attributes={},
            barcode_aliases=[],
            is_active=True,
            # ✅ PART 2: Default unit support
            primary_unit="piece",
            requires_serial_number=False,
            is_serialized=False,
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    products = db.query(ProductV2).filter(
        ProductV2.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()
    
    # Variantlarni yuklash
    for product in products:
        product.variants = db.query(ProductVariant).filter(
            ProductVariant.product_id == product.id
        ).all()
    
    # Hide cost_price for seller/cashier role (role is now a string)
    is_seller = current_user.role == "cashier"
    if is_seller:
        for product in products:
            product.cost_price = None
            for variant in product.variants:
                variant.cost_price = None
    
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta mahsulotni olish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    product.variants = db.query(ProductVariant).filter(
        ProductVariant.product_id == product.id
    ).all()
    
    # Hide cost_price for seller/cashier role (role is now a string)
    is_seller = current_user.role == "cashier"
    if is_seller:
        product.cost_price = None
        for variant in product.variants:
            variant.cost_price = None
    
    return product


@router.delete("/{product_id}")
def delete_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulotni o'chirish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    # Delete variants first
    db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
    
    # Delete product
    db.delete(product)
    db.commit()
    
    return {"message": "Mahsulot o'chirildi", "deleted_id": product_id}


@router.patch("/{product_id}", response_model=schemas.Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    product_in: schemas.ProductUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulotni yangilash"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    # Update fields
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(product, field):
            setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    # Load variants
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Variantni tekshirish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == variant_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    tier_obj = PriceTier(
        variant_id=variant_id,
        tenant_id=tenant_id,
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


@router.get("/expiring")
def get_expiring_products(
    db: Session = Depends(deps.get_db),
    days: int = 7,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Muddati yaqinlashayotgan mahsulotlarni olish.
    days - necha kun ichida muddati tugaydigan mahsulotlar
    """
    from datetime import date, timedelta
    
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Bugungi sana va limit sana
    today = date.today()
    limit_date = today + timedelta(days=days)
    
    # Muddati tugagan va yaqinlashayotgan variantlarni olish
    expiring_variants = db.query(ProductVariant).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.expiry_date != None,
            ProductVariant.expiry_date <= limit_date,
            ProductVariant.is_active == True,
            ProductVariant.stock_quantity > 0  # Faqat omborida bor bo'lganlar
        )
    ).order_by(ProductVariant.expiry_date.asc()).all()
    
    result = []
    for variant in expiring_variants:
        product = db.query(ProductV2).filter(ProductV2.id == variant.product_id).first()
        days_until_expiry = (variant.expiry_date - today).days
        
        result.append({
            "variant_id": variant.id,
            "product_id": variant.product_id,
            "product_name": product.name if product else "Noma'lum",
            "sku": variant.sku,
            "stock_quantity": variant.stock_quantity,
            "expiry_date": variant.expiry_date.isoformat(),
            "days_until_expiry": days_until_expiry,
            "batch_number": variant.batch_number,
            "status": "expired" if days_until_expiry < 0 else "expiring_soon",
            "price": variant.price,
            "cost_price": variant.cost_price,
            "potential_loss": variant.stock_quantity * variant.cost_price if days_until_expiry < 0 else 0
        })
    
    # Summary
    expired_count = len([r for r in result if r["status"] == "expired"])
    expiring_count = len([r for r in result if r["status"] == "expiring_soon"])
    total_potential_loss = sum(r["potential_loss"] for r in result)
    
    return {
        "summary": {
            "expired_count": expired_count,
            "expiring_soon_count": expiring_count,
            "total_items": len(result),
            "total_potential_loss": total_potential_loss
        },
        "items": result
    }


@router.get("/low-stock")
def get_low_stock_products(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Kam qolgan mahsulotlarni olish.
    stock_quantity <= min_stock_level bo'lgan variantlar.
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Kam qolgan variantlarni topish
    low_stock_variants = db.query(ProductVariant).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.is_active == True,
            ProductVariant.stock_quantity <= ProductVariant.min_stock_level
        )
    ).order_by(ProductVariant.stock_quantity.asc()).all()
    
    result = []
    for variant in low_stock_variants:
        product = db.query(ProductV2).filter(ProductV2.id == variant.product_id).first()
        
        # Status
        if (variant.stock_quantity or 0) <= 0:
            status = "out_of_stock"
        else:
            status = "low_stock"
        
        result.append({
            "variant_id": variant.id,
            "product_id": variant.product_id,
            "product_name": product.name if product else "Noma'lum",
            "sku": variant.sku,
            "stock_quantity": variant.stock_quantity or 0,
            "min_stock_level": variant.min_stock_level or 0,
            "status": status,
            "price": variant.price,
            "cost_price": variant.cost_price,
            "primary_unit": variant.primary_unit or "dona"
        })
    
    # Summary
    out_of_stock_count = len([r for r in result if r["status"] == "out_of_stock"])
    low_stock_count = len([r for r in result if r["status"] == "low_stock"])
    
    return {
        "summary": {
            "out_of_stock_count": out_of_stock_count,
            "low_stock_count": low_stock_count,
            "total_items": len(result)
        },
        "items": result
    }


@router.post("/{product_id}/variants/{variant_id}/stock")
def adjust_stock(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    variant_id: int,
    quantity: float,
    adjustment_type: str = "add",  # "add" or "subtract" or "set"
    reason: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Stock miqdorini o'zgartirish.
    adjustment_type: "add" (qo'shish), "subtract" (ayirish), "set" (o'rnatish)
    """
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Variantni topish
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.tenant_id == tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    old_quantity = variant.stock_quantity or 0
    
    if adjustment_type == "add":
        new_quantity = old_quantity + quantity
    elif adjustment_type == "subtract":
        new_quantity = old_quantity - quantity
        if new_quantity < 0:
            raise HTTPException(status_code=400, detail="Yetarli stock yo'q")
    elif adjustment_type == "set":
        new_quantity = quantity
    else:
        raise HTTPException(status_code=400, detail="Noto'g'ri adjustment_type")
    
    variant.stock_quantity = new_quantity
    
    db.commit()
    db.refresh(variant)
    
    return {
        "message": "Stock yangilandi",
        "variant_id": variant.id,
        "old_quantity": old_quantity,
        "new_quantity": new_quantity,
        "adjustment": quantity,
        "adjustment_type": adjustment_type
    }


