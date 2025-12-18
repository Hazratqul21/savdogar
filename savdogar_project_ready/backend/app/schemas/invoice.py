from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.invoice import InvoiceStatus

class InvoiceItemBase(BaseModel):
    product_name_raw: str
    quantity: float = 0.0
    price: float = 0.0
    product_id: Optional[int] = None

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    supplier_name: Optional[str] = None
    total_amount: float = 0.0
    status: InvoiceStatus = InvoiceStatus.PENDING
    image_url: Optional[str] = None
    processed_data: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []

class InvoiceUpdate(InvoiceBase):
    supplier_name: Optional[str] = None
    status: Optional[InvoiceStatus] = None

class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    items: List[InvoiceItem] = []
    
    class Config:
        from_attributes = True

# AI Scan Result
class AIScannedItem(BaseModel):
    product_name: str
    quantity: float
    price: float
    total: float

class AIScanResult(BaseModel):
    supplier_name: Optional[str] = None
    items: List[AIScannedItem] = []
    total_amount: float = 0.0
    raw_text: Optional[str] = None
