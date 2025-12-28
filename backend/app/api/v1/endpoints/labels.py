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
    products = db.query(Product).filter(Product.id.in_(request.product_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found")
    
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
