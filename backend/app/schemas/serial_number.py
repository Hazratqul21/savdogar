"""
Serial Number Schemas for Plumbing & HVAC
✅ PART 2: API schemas for serial number management
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime

class SerialNumberCreate(BaseModel):
    """Serial number yaratish"""
    variant_id: int = Field(..., description="Product variant ID")
    serial_number: str = Field(..., min_length=1, description="Serial number (unique per tenant)")
    manufacturer_serial: Optional[str] = Field(None, description="Manufacturer serial number")
    batch_number: Optional[str] = Field(None, description="Batch number")
    notes: Optional[str] = None

class SerialNumberBulkCreate(BaseModel):
    """Bulk serial number yaratish (shipment uchun)"""
    variant_id: int = Field(..., description="Product variant ID")
    serial_numbers: List[str] = Field(..., min_items=1, description="List of serial numbers")
    batch_number: Optional[str] = Field(None, description="Batch number for all serials")
    notes: Optional[str] = None

class SerialNumberUpdate(BaseModel):
    """Serial number yangilash"""
    serial_number: Optional[str] = None
    warranty_start_date: Optional[date] = None
    warranty_duration_months: Optional[int] = Field(None, ge=1, le=120)
    installation_date: Optional[date] = None
    installation_address: Optional[str] = None
    installer_name: Optional[str] = None
    installer_phone: Optional[str] = None
    is_sold: Optional[bool] = None
    is_installed: Optional[bool] = None
    notes: Optional[str] = None

class SerialNumber(BaseModel):
    """Serial number response"""
    id: int
    tenant_id: int
    variant_id: int
    serial_number: str
    sale_id: Optional[int]
    sale_item_id: Optional[int]
    customer_id: Optional[int]
    warranty_start_date: Optional[date]
    warranty_duration_months: Optional[int]
    warranty_end_date: Optional[date]
    installation_date: Optional[date]
    installation_address: Optional[str]
    installer_name: Optional[str]
    installer_phone: Optional[str]
    is_active: bool
    is_sold: bool
    is_installed: bool
    notes: Optional[str]
    manufacturer_serial: Optional[str]
    batch_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True






