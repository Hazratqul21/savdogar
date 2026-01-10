from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.services.product_lookup import product_lookup
from app.models.product import Product
from app.models.user import User
from typing import Any

router = APIRouter()

@router.get("/lookup/{barcode}")
async def lookup_product(
    barcode: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Shtrix-kod bo'yicha mahsulotni qidirish (Local DB + External API)
    """
    # ✅ SECURITY FIX: Tenant isolation check
    # Try ProductV2/ProductVariant first (new multi-tenant model)
    from app.models.product_v2 import ProductVariant
    from sqlalchemy import and_
    
    if current_user.tenant_id:
        # Use ProductVariant (new model with tenant_id)
        variant = db.query(ProductVariant).filter(
            and_(
                ProductVariant.tenant_id == current_user.tenant_id,
                ProductVariant.barcode_aliases.contains([barcode])
            )
        ).first()
        
        if variant:
            return {
                "found": True,
                "source": "local",
                "variant": variant,
                "product": variant.product_v2
            }
    
    # Fallback to legacy Product model (organization_id)
    if current_user.organization_id:
        local_product = db.query(Product).filter(
            and_(
                Product.barcode == barcode,
                Product.organization_id == current_user.organization_id
            )
        ).first()
        
        if local_product:
            return {
                "found": True,
                "source": "local",
                "product": local_product
            }

    # 2. External API dan qidirish
    external_product = await product_lookup.lookup_by_barcode(barcode)
    
    if external_product:
        return {
            "found": True,
            "source": "external",
            "product": external_product
        }

    # 3. Topilmadi
    return {
        "found": False,
        "source": None,
        "barcode": barcode
    }
