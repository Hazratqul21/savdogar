"""
AI Invoice Parser Endpoint
Smart Dual-Model: gpt-4o-mini (printed) or gpt-4o (handwritten)
Returns product details for adding to products_v2
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
import base64
import json
import logging

from app.api import deps
from app.models import User
from app.services.openai_hybrid_client import get_hybrid_openai
from app.core.file_storage import upload_file
from app.services.logging import get_logger
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter()


@router.post("/parse-invoice")
async def parse_invoice(
    file: UploadFile = File(...),
    is_handwritten: bool = Query(
        default=False,
        description="Toggle: True for handwritten/hard to read (uses gpt-4o), False for printed (uses gpt-4o-mini)"
    ),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Parse invoice image using AI.
    
    Model Selection:
    - is_handwritten=False (default): Uses gpt-4o-mini (cost-effective for printed text)
    - is_handwritten=True: Uses gpt-4o (high intelligence for handwriting)
    
    Returns:
    {
        "success": true,
        "items": [
            {
                "product_name": "Product Name",
                "quantity": 10.0,
                "price": 15000.0,
                "unit": "kg"
            }
        ],
        "model_used": "gpt-4o-mini" or "gpt-4o"
    }
    """
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
        raise HTTPException(
            status_code=400,
            detail="Only image files are accepted (JPEG, PNG, GIF, WEBP, HEIC)"
        )
    
    # Read file content
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Determine mode based on toggle
    mode = "handwritten" if is_handwritten else "printed"
    
    # Step 1: Upload image to Supabase Storage
    image_url = None
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.id}_{timestamp}_{file.filename or 'invoice.jpg'}"
        image_url = upload_file(content, filename, subdirectory="invoices")
        logger.info(f"Uploaded invoice image to Supabase Storage: {image_url}")
    except Exception as e:
        logger.error(f"Failed to upload image to Supabase Storage: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )
    
    # Step 2: Analyze with OpenAI using hybrid model selection
    try:
        result = await hybrid_openai.analyze_invoice_image(
            image_url=image_url,
            filename=file.filename or "invoice.jpg",
            mode=mode
        )
        
        items = result.get("items", [])
        model_used = result.get("model_used", "unknown")
        
        if not items:
            return {
                "success": False,
                "items": [],
                "model_used": model_used,
                "error": "No items could be extracted from the invoice. Please try again or use manual entry."
            }
        
        return {
            "success": True,
            "items": items,
            "model_used": model_used,
            "mode": mode,
            "image_url": image_url
        }
        
    except ValueError as e:
        # AI parsing errors
        logger.error(f"AI parsing error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse invoice: {str(e)}. Please try again or use manual entry."
        )
    except Exception as e:
        # Other errors
        logger.error(f"Error scanning invoice: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Scan failed: {str(e)}. Please try again or use manual entry."
        )
