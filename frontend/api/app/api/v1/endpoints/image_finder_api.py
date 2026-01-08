from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.product import Product
from app.models.user import User, UserRole
from app.services.image_finder import image_finder

router = APIRouter()

@router.post("/{product_id}/find-image")
def find_and_set_image(
    product_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mahsulot uchun internetdan rasm topish va saqlash
    """
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Rasm qidirish
    image_url = image_finder.find_product_image(product.name)
    
    if image_url:
        product.image_url = image_url
        db.commit()
        db.refresh(product)
        return {"success": True, "image_url": image_url}
    else:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")
