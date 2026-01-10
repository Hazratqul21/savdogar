from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List, Any
from app.api import deps
from app.models import Product, User
from app.services.label_service import generate_qr_pdf
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter()

class LabelRequest(BaseModel):
    product_ids: List[int]

@router.post("/generate", response_class=Response)
def generate_labels(
    request: LabelRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate PDF with QR labels for selected products.
    """
    # ✅ SECURITY FIX: Tenant/organization isolation check
    from sqlalchemy import and_
    
    if not current_user.tenant_id and not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organization topilmadi")
    
    # Try ProductV2/ProductVariant first (new multi-tenant model)
    if current_user.tenant_id:
        from app.models.product_v2 import ProductV2
        products_v2 = db.query(ProductV2).filter(
            and_(
                ProductV2.id.in_(request.product_ids),
                ProductV2.tenant_id == current_user.tenant_id
            )
        ).all()
        
        if products_v2:
            # Format for service
            data = []
            for p in products_v2:
                # Get first variant for SKU
                variant = p.variants[0] if p.variants else None
                data.append({
                    "name": p.name,
                    "sku": variant.sku if variant else str(p.id),
                    "price": variant.price if variant else p.base_price
                })
            
            pdf_bytes = generate_qr_pdf(data)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=labels.pdf"}
            )
    
    # Fallback to legacy Product model (organization_id)
    if current_user.organization_id:
        products = db.query(Product).filter(
            and_(
                Product.id.in_(request.product_ids),
                Product.organization_id == current_user.organization_id
            )
        ).all()
        
        if not products:
            raise HTTPException(status_code=404, detail="Mahsulotlar topilmadi")
    
    # Format for service
    data = []
    for p in products:
        # If Fashion/Jewelry, use specific attributes if needed, but simplistic for now
        data.append({
            "name": p.name,
            "sku": p.sku or p.barcode or str(p.id), # Fallback to ID if no SKU
            "price": p.price
        })
        
    pdf_bytes = generate_qr_pdf(data)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=labels.pdf"}
    )
