from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.receipt import ReceiptStatus

class ExtractedItem(BaseModel):
    """Single item extracted from receipt."""
    name: str
    quantity: float
    unit_price: float
    total_price: float
    recommended_price: Optional[float] = None  # Tavsiya etilgan sotish narxi
    matched_product_id: Optional[int] = None

class ReceiptAnalysisResponse(BaseModel):
    """Response after AI analysis of receipt."""
    receipt_id: int
    store_name: Optional[str] = None
    date: Optional[str] = None
    items: List[ExtractedItem]
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: float
    currency: Optional[str] = "UZS"
    status: ReceiptStatus

class ReceiptUploadResponse(BaseModel):
    """Response immediately after upload."""
    receipt_id: int
    message: str
    analysis: ReceiptAnalysisResponse

class ReceiptItemUpdate(BaseModel):
    """Item data for confirmation with user edits."""
    name: str
    quantity: float
    unit_price: float
    total_price: float
    recommended_price: Optional[float] = None  # Tavsiya etilgan sotish narxi (o'zgartirish mumkin)
    matched_product_id: Optional[int] = None

class ReceiptConfirmRequest(BaseModel):
    """Request to confirm receipt with optional edits."""
    items: List[ReceiptItemUpdate]
    payment_method: str = "cash"
    customer_id: Optional[int] = None

class ScannedReceiptItemResponse(BaseModel):
    """Response for a single receipt item."""
    id: int
    product_name: str
    quantity: float
    unit_price: float
    total_price: float
    matched_product_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class ScannedReceiptResponse(BaseModel):
    """Full scanned receipt response."""
    id: int
    user_id: int
    image_path: str
    status: ReceiptStatus
    ai_response: Optional[dict] = None
    sale_id: Optional[int] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    items: List[ScannedReceiptItemResponse] = []
    
    class Config:
        from_attributes = True

class ReceiptHistoryItem(BaseModel):
    """Simplified receipt for history list."""
    id: int
    status: ReceiptStatus
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    total_amount: float
    items_count: int
    
    class Config:
        from_attributes = True
