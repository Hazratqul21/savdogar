from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from app.models.sale_v2 import PaymentMethod, SaleStatus
from app.models.customer_v2 import CustomerTier

# ==================== Sale Item Schemas ====================

class SaleItemCreate(BaseModel):
    """Sotuv elementi yaratish"""
    variant_id: int = Field(..., description="Product variant ID")
    quantity: float = Field(..., gt=0, description="Miqdor")
    unit_price: Optional[float] = Field(None, gt=0, description="Narx (agar None bo'lsa, variant narxidan olinadi)")
    discount_percent: Optional[float] = Field(0.0, ge=0, le=100)
    discount_amount: Optional[float] = Field(0.0, ge=0)
    notes: Optional[str] = None

class SaleItem(BaseModel):
    """Sale item response"""
    id: int
    sale_id: int
    variant_id: int
    quantity: float
    unit_price: float
    cost_price: float
    total: float
    discount_percent: float
    discount_amount: float
    tax_rate: float
    tax_amount: float
    
    class Config:
        from_attributes = True

# ==================== Sale/Cart Schemas ====================

class CartItem(BaseModel):
    """Savatcha elementi"""
    variant_id: int
    quantity: float = Field(..., gt=0)
    discount_percent: Optional[float] = Field(0.0, ge=0, le=100)

class CheckoutRequest(BaseModel):
    """Checkout so'rovi"""
    items: List[CartItem] = Field(..., min_items=1)
    customer_id: Optional[int] = None
    branch_id: Optional[int] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    
    # Qarz uchun
    debt_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    
    @validator('debt_amount')
    def validate_debt(cls, v, values):
        """Qarz to'lov usuli uchun tekshirish"""
        if values.get('payment_method') == PaymentMethod.DEBT and not v:
            raise ValueError("DEBT payment method uchun debt_amount majburiy")
        return v

class SaleCreate(BaseModel):
    """Sotuv yaratish (Checkout dan keyin)"""
    tenant_id: int
    cashier_id: Optional[int] = None
    customer_id: Optional[int] = None
    branch_id: Optional[int] = None
    items: List[SaleItemCreate]
    payment_method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None

class SaleUpdate(BaseModel):
    """Sotuv yangilash"""
    status: Optional[SaleStatus] = None
    notes: Optional[str] = None

class Sale(BaseModel):
    """Sale response"""
    id: int
    tenant_id: int
    cashier_id: Optional[int]
    customer_id: Optional[int]
    branch_id: Optional[int]
    total_amount: float
    subtotal: float
    tax_amount: float
    discount_amount: float
    service_charge: Optional[float] = 0.0
    payment_method: PaymentMethod
    status: SaleStatus
    is_debt: bool
    debt_amount: float
    receipt_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    items: List[SaleItem] = []
    
    class Config:
        from_attributes = True

# ==================== Cart Calculation ====================

class CartCalculationResult(BaseModel):
    """Savatcha hisoblash natijasi"""
    subtotal: float
    tax_amount: float
    discount_amount: float
    total: float
    service_charge: Optional[float] = 0.0
    items: List[Dict[str, Any]]  # Har bir element uchun narx ma'lumotlari
    applied_price_tiers: List[Dict[str, Any]]  # Qo'llangan narx darajalari








