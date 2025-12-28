import os
import shutil
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.models import User, ScannedReceipt, ScannedReceiptItem, Sale, SaleItem, Product, UserRole
from typing import Optional
from app.models.receipt import ReceiptStatus
from app.models.sale import PaymentMethod
from app.schemas.receipt import (
    ReceiptUploadResponse, ReceiptAnalysisResponse, ExtractedItem,
    ReceiptConfirmRequest, ScannedReceiptResponse, ReceiptHistoryItem
)
from app.services.openai_service import openai_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

def get_organization_id_for_user(current_user: User, db: Session) -> int:
    """
    Get organization_id for user. For super_admin, returns default organization.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        if not current_user.organization_id:
            from app.models import Organization
            default_org = db.query(Organization).first()
            if not default_org:
                default_org = Organization(
                    name="Default Organization",
                    description="Default organization for super admin",
                    is_active=True
                )
                db.add(default_org)
                db.commit()
                db.refresh(default_org)
            return default_org.id
        return current_user.organization_id
    else:
        return deps.require_organization(current_user=current_user, db=db)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload and analyze receipt image using Azure OpenAI Vision API.
    Supports JPEG, PNG, GIF, WEBP, and HEIC/HEIF formats.
    """
    # Validate file type - accept all image types including HEIC
    allowed_types = [
        "image/jpeg", "image/jpg", "image/png", "image/gif", 
        "image/webp", "image/heic", "image/heif"
    ]
    
    # Also check file extension for HEIC files (browsers might not send correct MIME type)
    file_ext = os.path.splitext(file.filename or "")[1].lower() if file.filename else ""
    heic_extensions = [".heic", ".heif", ".hif"]
    
    is_image = (
        (file.content_type and file.content_type.startswith("image/")) or
        file_ext in heic_extensions
    )
    
    if not is_image:
        raise HTTPException(
            status_code=400, 
            detail="Faqat rasm fayllari qabul qilinadi (JPEG, PNG, GIF, WEBP, HEIC)"
        )
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        # Get organization_id first (before AI analysis)
        organization_id = get_organization_id_for_user(current_user, db)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Analyze with Azure OpenAI
        try:
            ai_response = openai_service.analyze_receipt_image(file_path)
        except Exception as ai_error:
            logger.error(f"AI analysis error: {ai_error}")
            # Clean up file on AI error
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=500, 
                detail=f"AI tahlil qilishda xatolik: {str(ai_error)}. Iltimos, rasm sifatini tekshiring yoki qayta urinib ko'ring."
            )
        
        # Create scanned receipt record
        receipt = ScannedReceipt(
            user_id=current_user.id,
            organization_id=organization_id,
            image_path=file_path,
            status="pending",  # Use string value
            ai_response=ai_response
        )
        db.add(receipt)
        db.flush()
        
        # Create receipt items
        items = []
        ai_items = ai_response.get("items", [])
        if not isinstance(ai_items, list):
            ai_items = []
            
        for item_data in ai_items:
            if not isinstance(item_data, dict):
                continue
                
            try:
                # Try to match product by name (within same organization)
                product_name = item_data.get('name', '').strip()
                if not product_name:
                    continue
                    
                matched_product = db.query(Product).filter(
                    Product.name.ilike(f"%{product_name}%"),
                    Product.organization_id == organization_id
                ).first()
                
                # Safely convert values to float
                quantity = float(item_data.get("quantity", 1.0) or 1.0)
                unit_price = float(item_data.get("unit_price", 0.0) or 0.0)
                total_price = float(item_data.get("total_price", 0.0) or (quantity * unit_price))
                
                # Get recommended_price from AI response (if available)
                recommended_price = item_data.get("recommended_price")
                if recommended_price:
                    recommended_price = float(recommended_price)
                elif unit_price > 0:
                    # Calculate recommended price (25% markup)
                    recommended_price = unit_price * 1.25
                else:
                    recommended_price = None
                
                receipt_item = ScannedReceiptItem(
                    receipt_id=receipt.id,
                    product_name=product_name,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    matched_product_id=matched_product.id if matched_product else None
                )
                db.add(receipt_item)
                items.append(ExtractedItem(
                    name=receipt_item.product_name,
                    quantity=receipt_item.quantity,
                    unit_price=receipt_item.unit_price,
                    total_price=receipt_item.total_price,
                    recommended_price=recommended_price,
                    matched_product_id=receipt_item.matched_product_id
                ))
            except (ValueError, TypeError) as e:
                logger.warning(f"Error processing item: {item_data}, error: {e}")
                continue
        
        db.commit()
        db.refresh(receipt)
        
        # Build response with safe value conversion
        try:
            subtotal = float(ai_response.get("subtotal", 0.0) or 0.0)
        except (ValueError, TypeError):
            subtotal = 0.0
            
        try:
            tax = float(ai_response.get("tax", 0.0) or 0.0)
        except (ValueError, TypeError):
            tax = 0.0
            
        try:
            total = float(ai_response.get("total", 0.0) or 0.0)
        except (ValueError, TypeError):
            total = subtotal + tax
            
        analysis = ReceiptAnalysisResponse(
            receipt_id=receipt.id,
            store_name=ai_response.get("store_name") or None,
            date=ai_response.get("date") or None,
            items=items,
            subtotal=subtotal,
            tax=tax,
            total=total,
            currency=ai_response.get("currency", "UZS") or "UZS",
            status=receipt.status
        )
        
        return ReceiptUploadResponse(
            receipt_id=receipt.id,
            message="Chek muvaffaqiyatli tahlil qilindi",
            analysis=analysis
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Receipt upload error: {e}", exc_info=True)
        # Clean up file on error
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(
            status_code=500, 
            detail=f"Xatolik: {str(e)}. Iltimos, qayta urinib ko'ring yoki administratorga murojaat qiling."
        )


@router.get("/{receipt_id}", response_model=ScannedReceiptResponse)
def get_receipt(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    receipt_id: int
) -> Any:
    """Get scanned receipt details."""
    receipt = db.query(ScannedReceipt).filter(
        ScannedReceipt.id == receipt_id,
        ScannedReceipt.user_id == current_user.id
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Chek topilmadi")
    
    return receipt


@router.post("/{receipt_id}/confirm")
def confirm_receipt(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    receipt_id: int,
    data: ReceiptConfirmRequest
) -> Any:
    """
    Confirm scanned receipt and create sale record.
    User can edit items before confirmation.
    """
    # Get receipt
    receipt = db.query(ScannedReceipt).filter(
        ScannedReceipt.id == receipt_id,
        ScannedReceipt.user_id == current_user.id,
        ScannedReceipt.status == "pending"  # Use string value
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Chek topilmadi yoki allaqachon tasdiqlangan")
    
    try:
        # Get organization_id
        org_id = get_organization_id_for_user(current_user, db)
        
        # Create sale
        sale = Sale(
            cashier_id=current_user.id,
            organization_id=org_id,
            payment_method=PaymentMethod(data.payment_method),
            total_amount=0.0
        )
        db.add(sale)
        db.flush()
        
        # Create sale items and products
        total_amount = 0.0
        created_products = []  # Track created products for response
        
        for item_data in data.items:
            # Get or create product
            product = None
            if item_data.matched_product_id:
                product = db.query(Product).filter(Product.id == item_data.matched_product_id).first()
            
            if not product:
                # Get organization_id (already have org_id from above, reuse it)
                # Check if product with same name already exists (within same organization)
                existing_product = db.query(Product).filter(
                    Product.name.ilike(f"%{item_data.name}%"),
                    Product.organization_id == org_id
                ).first()
                
                if existing_product:
                    # Use existing product
                    product = existing_product
                else:
                    # Create new product with recommended price or unit_price
                    selling_price = item_data.recommended_price if (item_data.recommended_price and item_data.recommended_price > 0) else item_data.unit_price
                    product = Product(
                        name=item_data.name,
                        organization_id=org_id,
                        price=selling_price,  # Use recommended price if available
                        cost_price=item_data.unit_price,  # Cost price from receipt
                        stock_quantity=0.0,
                        unit="dona"  # Default unit
                    )
                    db.add(product)
                    db.flush()
                    created_products.append({
                        "id": product.id,
                        "name": product.name,
                        "price": product.price
                    })
            
            # Check stock before creating sale item
            if product.stock_quantity < item_data.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Ombor yetarli emas: {product.name}. Mavjud: {product.stock_quantity}, Talab: {item_data.quantity}"
                )
            
            # Create sale item
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=item_data.quantity,
                price=item_data.unit_price,
                total=item_data.total_price
            )
            db.add(sale_item)
            
            # Update product stock - avtomatik minus qilish
            product.stock_quantity -= item_data.quantity
            db.add(product)
            
            # Create inventory movement record
            from app.models import InventoryMovement, MovementType
            inventory_movement = InventoryMovement(
                product_id=product.id,
                quantity=item_data.quantity,
                movement_type=MovementType.OUT,
                reference_type="receipt_sale",
                reference_id=sale.id,
                notes=f"Receipt sale #{sale.id}: {item_data.quantity} {product.unit} sold",
                created_by=current_user.id
            )
            db.add(inventory_movement)
            
            total_amount += item_data.total_price
        
        # Update sale total
        sale.total_amount = total_amount
        
        # Update receipt status
        receipt.status = "confirmed"  # Use string value
        receipt.confirmed_at = datetime.utcnow()
        receipt.sale_id = sale.id
        
        db.commit()
        
        return {
            "message": "Chek muvaffaqiyatli tasdiqlandi",
            "sale_id": sale.id,
            "total_amount": total_amount,
            "products_created": len(created_products),
            "created_products": created_products
        }
        
    except Exception as e:
        db.rollback()
        import traceback
        logger.error(f"Error confirming receipt: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")


@router.delete("/{receipt_id}")
def delete_receipt(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    receipt_id: int
) -> Any:
    """Reject/delete a scanned receipt."""
    receipt = db.query(ScannedReceipt).filter(
        ScannedReceipt.id == receipt_id,
        ScannedReceipt.user_id == current_user.id
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Chek topilmadi")
    
    # Delete image file
    if os.path.exists(receipt.image_path):
        os.remove(receipt.image_path)
    
    # Delete from database
    db.delete(receipt)
    db.commit()
    
    return {"message": "Chek o'chirildi"}


@router.get("/history/list", response_model=List[ReceiptHistoryItem])
def get_receipt_history(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    organization_id: Optional[int] = Depends(deps.get_user_organization)
) -> Any:
    """Get receipt history for current user."""
    organization_id: Optional[int] = Depends(deps.get_user_organization)
    
    query = db.query(ScannedReceipt).filter(ScannedReceipt.user_id == current_user.id)
    
    # Filter by organization (unless super_admin)
    if organization_id is not None:
        query = query.filter(ScannedReceipt.organization_id == organization_id)
    
    if status:
        query = query.filter(ScannedReceipt.status == status)  # Already string from request
    
    receipts = query.order_by(ScannedReceipt.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response
    result = []
    for receipt in receipts:
        items = db.query(ScannedReceiptItem).filter(ScannedReceiptItem.receipt_id == receipt.id).all()
        total_amount = sum(item.total_price for item in items)
        
        result.append(ReceiptHistoryItem(
            id=receipt.id,
            status=receipt.status,
            created_at=receipt.created_at,
            confirmed_at=receipt.confirmed_at,
            total_amount=total_amount,
            items_count=len(items)
        ))
    
    return result
