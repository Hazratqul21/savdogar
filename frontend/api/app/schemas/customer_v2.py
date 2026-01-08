from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from app.models.customer_v2 import CustomerTier
from app.models.sale_v2 import PaymentMethod

class CustomerCreate(BaseModel):
    """Mijoz yaratish"""
    name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    price_tier: CustomerTier = CustomerTier.RETAIL
    credit_limit: Optional[float] = Field(0.0, ge=0)
    max_debt_allowed: Optional[float] = Field(0.0, ge=0)
    customer_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata")

class CustomerUpdate(BaseModel):
    """Mijoz yangilash"""
    name: Optional[str] = Field(None, min_length=1)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    price_tier: Optional[CustomerTier] = None
    credit_limit: Optional[float] = Field(None, ge=0)
    max_debt_allowed: Optional[float] = Field(None, ge=0)
    customer_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata")

class Customer(BaseModel):
    """Customer response"""
    id: int
    tenant_id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    price_tier: CustomerTier
    balance: float
    credit_limit: float
    max_debt_allowed: float
    loyalty_points: float
    customer_metadata: Dict[str, Any] = Field(..., alias="metadata")
    created_at: datetime
    
    class Config:
        from_attributes = True

class CustomerLedgerEntry(BaseModel):
    """Mijoz qarz kitobi yozuvi"""
    id: int
    customer_id: int
    sale_id: Optional[int]
    debit: float
    credit: float
    balance_after: float
    description: Optional[str]
    reference_number: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True








