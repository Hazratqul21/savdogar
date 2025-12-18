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
    # 1. Local bazadan qidirish
    local_product = db.query(Product).filter(Product.barcode == barcode).first()
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
