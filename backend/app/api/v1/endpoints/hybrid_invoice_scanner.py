"""
Hybrid AI Invoice Scanner Endpoint
Optimizes for both cost and accuracy:
- printed mode: gpt-4o-mini (fast, cost-effective)
- handwritten mode: gpt-4o (high precision)

Workflow:
1. Upload image to Supabase Storage
2. Get public URL
3. Send URL to OpenAI for analysis
4. Save results to inventory_logs table
5. Return parsed data for frontend verification
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.models import User, InventoryLog
from app.schemas.invoice_scanner import (
    HybridScanResponse,
    HybridScanError,
    ScannedInvoiceItem
)
from app.services.openai_hybrid_client import get_hybrid_openai
from app.core.file_storage import upload_file
from app.services.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/scan", response_model=HybridScanResponse)
async def scan_invoice_hybrid(
    file: UploadFile = File(...),
    mode: str = Query(
        default="printed",
        description="Scan mode: 'printed' (fast, cost-effective) or 'handwritten' (high precision)"
    ),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Hybrid AI Invoice Scanner
    
    Accepts an image and mode parameter:
    - mode='printed' (default): Uses gpt-4o-mini for fast, cost-effective scanning
    - mode='handwritten': Uses gpt-4o for high precision on complex handwriting
    
    Returns structured JSON with product_name, quantity, price, unit for direct database insertion.
    """
    # Validate mode
    if mode not in ["printed", "handwritten"]:
        raise HTTPException(
            status_code=400,
            detail="Mode must be 'printed' or 'handwritten'"
        )
    
    # Check if hybrid OpenAI client is available
    hybrid_openai = get_hybrid_openai()
    if hybrid_openai is None:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    # Validate file type
    allowed_types = [
        "image/jpeg", "image/jpg", "image/png", "image/gif", 
        "image/webp", "image/heic", "image/heif"
    ]
    
    file_ext = (file.filename or "").lower().split('.')[-1]
    heic_extensions = ["heic", "heif", "hif"]
    
    is_image = (
        (file.content_type and file.content_type.startswith("image/")) or
        file_ext in heic_extensions
    )
    
    if not is_image:
        return HybridScanError(
            error="Only image files are accepted (JPEG, PNG, GIF, WEBP, HEIC)",
            error_code="INVALID_FILE_TYPE"
        )
    
    # Read file content
    try:
        content = await file.read()
        if len(content) == 0:
            return HybridScanError(
                error="Uploaded file is empty",
                error_code="EMPTY_FILE"
            )
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        return HybridScanError(
            error=f"Failed to read file: {str(e)}",
            error_code="FILE_READ_ERROR"
        )
    
    # Step 1: Upload image to Supabase Storage
    image_url = None
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.id}_{timestamp}_{file.filename or 'invoice.jpg'}"
        image_url = upload_file(content, filename, subdirectory="invoices")
        logger.info(f"Uploaded invoice image to Supabase Storage: {image_url}")
    except Exception as e:
        logger.error(f"Failed to upload image to Supabase Storage: {e}", exc_info=True)
        return HybridScanError(
            error=f"Failed to upload image: {str(e)}",
            error_code="STORAGE_UPLOAD_ERROR"
        )
    
        # Step 2: Analyze with OpenAI using Supabase URL
        try:
            result = await hybrid_openai.analyze_invoice_image(
                image_url=image_url,  # Use Supabase URL instead of base64
                filename=file.filename or "invoice.jpg",
                mode=mode
            )
        
        # Convert to response format
        items = [
            ScannedInvoiceItem(
                product_name=item["product_name"],
                quantity=item["quantity"],
                price=item["price"],
                unit=item["unit"]
            )
            for item in result.get("items", [])
        ]
        
        # Step 3: Save to inventory_logs table
        inventory_log = None
        try:
            inventory_log = InventoryLog(
                user_id=current_user.id,
                tenant_id=current_user.tenant_id,
                image_url=image_url,
                scan_mode=mode,
                model_used=result.get("model_used", "unknown"),
                items_count=len(items),
                items_data=[item.dict() for item in items] if items else None,
                status="pending" if items else "failed",
                error_message=None if items else "No items extracted"
            )
            db.add(inventory_log)
            db.commit()
            db.refresh(inventory_log)
            logger.info(f"Saved inventory log: {inventory_log.id}")
        except Exception as e:
            logger.error(f"Failed to save inventory log: {e}", exc_info=True)
            db.rollback()
            # Don't fail the request if logging fails
        
        # Check if any items were extracted
        if not items:
            return HybridScanResponse(
                success=False,
                items=[],
                model_used=result.get("model_used", "unknown"),
                mode=result.get("mode", mode),
                image_path=image_url,
                error="No items could be extracted from the invoice. Please try again or use manual entry."
            )
        
        return HybridScanResponse(
            success=True,
            items=items,
            model_used=result.get("model_used", "unknown"),
            mode=result.get("mode", mode),
            image_path=image_url
        )
        
    except ValueError as e:
        # AI parsing errors
        logger.error(f"AI parsing error: {e}")
        
        # Log error to database if image was uploaded
        if image_url:
            try:
                error_log = InventoryLog(
                    user_id=current_user.id,
                    tenant_id=current_user.tenant_id,
                    image_url=image_url,
                    scan_mode=mode,
                    model_used="unknown",
                    items_count=0,
                    items_data=None,
                    status="failed",
                    error_message=f"AI parsing error: {str(e)}"
                )
                db.add(error_log)
                db.commit()
            except Exception as log_error:
                logger.error(f"Failed to log error: {log_error}")
                db.rollback()
        
        return HybridScanResponse(
            success=False,
            items=[],
            model_used="unknown",
            mode=mode,
            image_path=image_url,
            error=f"Failed to parse invoice: {str(e)}. Please try again or use manual entry."
        )
    except Exception as e:
        # Other errors
        logger.error(f"Error scanning invoice: {e}", exc_info=True)
        
        # Log error to database if image was uploaded
        if image_url:
            try:
                error_log = InventoryLog(
                    user_id=current_user.id,
                    tenant_id=current_user.tenant_id,
                    image_url=image_url,
                    scan_mode=mode,
                    model_used="unknown",
                    items_count=0,
                    items_data=None,
                    status="failed",
                    error_message=f"Scan failed: {str(e)}"
                )
                db.add(error_log)
                db.commit()
            except Exception as log_error:
                logger.error(f"Failed to log error: {log_error}")
                db.rollback()
        
        return HybridScanResponse(
            success=False,
            items=[],
            model_used="unknown",
            mode=mode,
            image_path=image_url,
            error=f"Scan failed: {str(e)}. Please try again or use manual entry."
        )
