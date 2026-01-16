from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.sale import PaymentMethod

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float = 1.0
    price: float
    discount: float = 0.0

class SaleItemResponse(SaleItemCreate):
    id: int
    sale_id: int
    total: float
    
    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    payment_method: PaymentMethod = PaymentMethod.CASH
    customer_id: Optional[int] = None
    discount: float = 0.0

class SaleResponse(BaseModel):
    id: int
    cashier_id: int
    total_amount: float
    payment_method: PaymentMethod
    created_at: datetime
    items: List[SaleItemResponse] = []
    
    class Config:
        from_attributes = True

class Receipt(BaseModel):
    sale_id: int
    store_name: str = "SmartPOS Store"
    cashier_name: str
    items: List[dict]
    subtotal: float
    discount: float
    total: float
    payment_method: str
    created_at: str
