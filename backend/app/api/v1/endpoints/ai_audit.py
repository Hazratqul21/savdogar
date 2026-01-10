"""
AI Audit & Automation API Endpoints
✅ Active AI Audit Platform - CFO-style analysis
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.api import deps
from app.models import User
from app.models.audit_log import AuditLog, AuditSeverity, AuditCategory
from app.models.product_v2 import ProductVariant
from app.services.ai_audit_service import ai_audit_service
from app.services.ai_service import ai_service

router = APIRouter()

# ==================== Schemas ====================

class AuditLogResponse(BaseModel):
    """Audit log response"""
    id: int
    tenant_id: int
    category: AuditCategory
    severity: AuditSeverity
    title: str
    description: str
    context_data: Optional[dict] = None
    related_sale_id: Optional[int] = None
    related_variant_id: Optional[int] = None
    related_user_id: Optional[int] = None
    ai_confidence: Optional[float] = None
    ai_reasoning: Optional[str] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class StockCorrectionRequest(BaseModel):
    """Stock correction request"""
    approve: bool = Field(True, description="Approve the suggested correction")
    quantity_override: Optional[float] = Field(None, description="Override suggested quantity")

class StockCorrectionResponse(BaseModel):
    """Stock correction response"""
    variant_id: int
    current_stock: float
    suggested_correction: float
    analysis: dict
    draft_document: Optional[dict] = None
    message: str

class InvoiceParseRequest(BaseModel):
    """Invoice parsing request"""
    content: str = Field(..., description="Raw text or OCR text from invoice")
    is_image: bool = Field(False, description="Is the content an image URL?")
    image_url: Optional[str] = Field(None, description="Image URL if is_image=True")

class InvoiceParseResponse(BaseModel):
    """Invoice parsing response"""
    items: List[dict]
    supplier_name: Optional[str] = None
    total_amount: Optional[float] = None
    parsed_data: dict

# ==================== Endpoints ====================

@router.post("/daily-scan", response_model=List[AuditLogResponse])
async def trigger_daily_audit_scan(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    scan_date: Optional[date] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Trigger daily audit scan (can run in background)
    Scans transactions and inventory for anomalies
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    if scan_date is None:
        scan_date = date.today()
    
    try:
        # Run audit scan
        audit_logs = await ai_audit_service.daily_audit_scan(
            db=db,
            tenant_id=current_user.tenant_id,
            scan_date=scan_date
        )
        
        return audit_logs
        
    except Exception as e:
        logger.error(f"Error in daily audit scan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Audit scan xatosi: {str(e)}"
        )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(deps.get_db),
    severity: Optional[AuditSeverity] = None,
    category: Optional[AuditCategory] = None,
    is_resolved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get audit logs with filters
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    query = db.query(AuditLog).filter(
        AuditLog.tenant_id == current_user.tenant_id
    )
    
    if severity:
        query = query.filter(AuditLog.severity == severity)
    
    if category:
        query = query.filter(AuditLog.category == category)
    
    if is_resolved is not None:
        query = query.filter(AuditLog.is_resolved == is_resolved)
    
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    return logs

@router.get("/audit-logs/{log_id}", response_model=AuditLogResponse)
def get_audit_log(
    *,
    db: Session = Depends(deps.get_db),
    log_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get single audit log
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    log = db.query(AuditLog).filter(
        and_(
            AuditLog.id == log_id,
            AuditLog.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Audit log topilmadi")
    
    return log

@router.put("/audit-logs/{log_id}/resolve")
def resolve_audit_log(
    *,
    db: Session = Depends(deps.get_db),
    log_id: int,
    resolution_notes: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark audit log as resolved
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    log = db.query(AuditLog).filter(
        and_(
            AuditLog.id == log_id,
            AuditLog.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Audit log topilmadi")
    
    log.is_resolved = True
    log.resolved_at = datetime.utcnow()
    log.resolved_by = current_user.id
    if resolution_notes:
        log.resolution_notes = resolution_notes
    
    db.commit()
    db.refresh(log)
    
    return {"message": "Audit log resolved", "log_id": log_id}

@router.post("/fix-inventory/{variant_id}", response_model=StockCorrectionResponse)
async def fix_inventory(
    *,
    db: Session = Depends(deps.get_db),
    variant_id: int,
    correction: StockCorrectionRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Feature B: Smart Inventory Correction
    
    AI suggests stock correction based on sales history.
    If approved, creates a draft inbound document.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Verify variant belongs to tenant
    variant = db.query(ProductVariant).filter(
        and_(
            ProductVariant.id == variant_id,
            ProductVariant.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    try:
        # Get AI suggestion
        suggestion = await ai_audit_service.suggest_stock_correction(
            db=db,
            tenant_id=current_user.tenant_id,
            variant_id=variant_id
        )
        
        if correction.approve:
            # Use override quantity if provided
            correction_quantity = correction.quantity_override or suggestion["suggested_correction"]
            
            # Update stock
            variant.stock_quantity += correction_quantity
            
            # Create audit log for this correction
            audit_log = AuditLog(
                tenant_id=current_user.tenant_id,
                category=AuditCategory.STOCK_CORRECTION,
                severity=AuditSeverity.MEDIUM,
                title=f"Stock Correction: {variant.sku}",
                description=f"Stock corrected by {correction_quantity} units. "
                           f"Previous: {suggestion['current_stock']}, "
                           f"New: {variant.stock_quantity}",
                context_data={
                    "variant_id": variant_id,
                    "previous_stock": suggestion["current_stock"],
                    "correction_quantity": correction_quantity,
                    "new_stock": variant.stock_quantity,
                    "ai_suggestion": suggestion
                },
                related_variant_id=variant_id,
                ai_confidence=suggestion["analysis"].get("confidence", 0.7),
                ai_reasoning=suggestion["analysis"].get("reasoning", ""),
                is_resolved=True,
                resolved_at=datetime.utcnow(),
                resolved_by=current_user.id
            )
            db.add(audit_log)
            db.commit()
            
            return StockCorrectionResponse(
                variant_id=variant_id,
                current_stock=variant.stock_quantity,
                suggested_correction=correction_quantity,
                analysis=suggestion["analysis"],
                draft_document=None,  # Already applied
                message=f"Stock corrected: {correction_quantity} units added. New stock: {variant.stock_quantity}"
            )
        else:
            # Return suggestion without applying
            return StockCorrectionResponse(
                variant_id=variant_id,
                current_stock=suggestion["current_stock"],
                suggested_correction=suggestion["suggested_correction"],
                analysis=suggestion["analysis"],
                draft_document=suggestion["draft_document"],
                message="Suggestion generated. Approve to apply correction."
            )
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error in fix_inventory: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Inventory correction xatosi: {str(e)}"
        )

@router.post("/parse-invoice", response_model=InvoiceParseResponse)
async def parse_invoice(
    *,
    db: Session = Depends(deps.get_db),
    invoice_data: InvoiceParseRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Feature C: Magic Import - Unstructured Data Parsing
    
    Parses raw text or image invoice into structured JSON.
    Uses GlobalCatalog (if available) for fuzzy product matching.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    try:
        # Use existing AI service invoice parsing
        # Note: This uses organization_id in the existing method, but we'll adapt for tenant_id
        # For now, we'll enhance it to work with tenant_id
        
        if invoice_data.is_image and invoice_data.image_url:
            # Image-based parsing
            parsed_data = await ai_service.parse_invoice_and_update_stock(
                invoice_content=None,
                db=db,
                organization_id=None,  # Will need to adapt for tenant
                is_image=True,
                image_url=invoice_data.image_url
            )
        else:
            # Text-based parsing
            parsed_data = await ai_service.parse_invoice_and_update_stock(
                invoice_content=invoice_data.content,
                db=db,
                organization_id=None,  # Will need to adapt for tenant
                is_image=False,
                image_url=None
            )
        
        # Extract items from parsed data
        # The parse_invoice method returns an Invoice object, but we need structured data
        items = []
        if hasattr(parsed_data, 'items'):
            for item in parsed_data.items:
                items.append({
                    "product_name": item.product_name_raw,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price": item.price
                })
        
        return InvoiceParseResponse(
            items=items,
            supplier_name=getattr(parsed_data, 'supplier_name', None),
            total_amount=getattr(parsed_data, 'total_amount', None),
            parsed_data={
                "invoice_id": parsed_data.id if hasattr(parsed_data, 'id') else None,
                "status": "parsed"
            }
        )
        
    except Exception as e:
        logger.error(f"Error parsing invoice: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Invoice parsing xatosi: {str(e)}"
        )

import logging
logger = logging.getLogger(__name__)






