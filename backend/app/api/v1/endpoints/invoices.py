from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import base64
import json

from app.api import deps
from app.models import Invoice, InvoiceItem, User
from app.schemas import invoice as invoice_schema

router = APIRouter()

from app.services.azure_openai_client import azure_openai

async def process_invoice_with_ai(image_data: bytes, filename: str) -> dict:
    """Process invoice image using Azure OpenAI."""
    try:
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        ext = filename.lower().split('.')[-1]
        media_type = "image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}"
        image_url = f"data:{media_type};base64,{image_base64}"

        system_prompt = """Analyze this invoice/receipt image and extract the following information in JSON format:
{
    "supplier_name": "Name of the supplier/vendor",
    "items": [
        {"product_name": "Product name", "quantity": 1.0, "price": 10.0, "total": 10.0}
    ],
    "total_amount": 100.0
}
Return ONLY the JSON, no other text. If you cannot read something, use null or 0."""

        return await azure_openai.analyze_image(system_prompt, image_url)
            
    except Exception as e:
        return {"error": str(e), "items": [], "supplier_name": None, "total_amount": 0}

@router.post("/upload-scan", response_model=invoice_schema.AIScanResult)
async def upload_and_scan_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload invoice image and process with AI."""
    # Read file content
    content = await file.read()
    
    # Process with AI
    result = await process_invoice_with_ai(content, file.filename)
    
    if "error" in result and result.get("items") == []:
        raise HTTPException(status_code=400, detail=result.get("error", "AI processing failed"))
    
    return invoice_schema.AIScanResult(
        supplier_name=result.get("supplier_name"),
        items=[invoice_schema.AIScannedItem(**item) for item in result.get("items", [])],
        total_amount=result.get("total_amount", 0),
    )

@router.post("/confirm-scan", response_model=invoice_schema.Invoice)
def confirm_scanned_invoice(
    *,
    db: Session = Depends(deps.get_db),
    invoice_in: invoice_schema.InvoiceCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Confirm and save scanned invoice to database."""
    invoice = Invoice(
        supplier_name=invoice_in.supplier_name,
        total_amount=invoice_in.total_amount,
        status=invoice_in.status,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Add items
    for item_data in invoice_in.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            product_name_raw=item_data.product_name_raw,
            quantity=item_data.quantity,
            price=item_data.price,
            product_id=item_data.product_id,
        )
        db.add(item)
    
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/", response_model=List[invoice_schema.Invoice])
def read_invoices(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all invoices."""
    invoices = db.query(Invoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/{id}", response_model=invoice_schema.Invoice)
def read_invoice(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get invoice by ID."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
