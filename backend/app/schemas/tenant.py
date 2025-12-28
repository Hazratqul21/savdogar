from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.tenant import BusinessType

class TenantConfig(BaseModel):
    """Tenant konfiguratsiyasi - Industry-specific settings"""
    # Retail
    allow_negative_stock: Optional[bool] = False
    require_barcode: Optional[bool] = False
    
    # Fashion
    size_chart: Optional[Dict[str, Any]] = None
    color_variants: Optional[bool] = True
    
    # Horeca
    print_kitchen_ticket: Optional[bool] = False
    table_service: Optional[bool] = False
    
    # Wholesale
    min_order_quantity: Optional[int] = 1
    credit_limit: Optional[float] = 0.0
    
    class Config:
        extra = "allow"

class TenantCreate(BaseModel):
    """Tenant yaratish"""
    name: str = Field(..., min_length=1)
    business_type: BusinessType
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class TenantUpdate(BaseModel):
    """Tenant yangilash"""
    name: Optional[str] = Field(None, min_length=1)
    business_type: Optional[BusinessType] = None
    config: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class Tenant(BaseModel):
    """Tenant response"""
    id: int
    name: str
    business_type: BusinessType
    config: Dict[str, Any]
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True








