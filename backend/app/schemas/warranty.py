"""
Warranty Schemas for Plumbing & HVAC
✅ PART 2: API schemas for warranty management
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime
from app.models.warranty import WarrantyType, WarrantyStatus

class WarrantyCreate(BaseModel):
    """Warranty yaratish"""
    serial_number_id: int = Field(..., description="Serial number ID")
    warranty_type: WarrantyType = WarrantyType.MANUFACTURER
    start_date: date = Field(..., description="Warranty start date")
    duration_months: int = Field(12, ge=1, le=120, description="Warranty duration in months")
    coverage_description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    warranty_provider: Optional[str] = None
    warranty_number: Optional[str] = Field(None, description="Warranty number (unique)")
    notes: Optional[str] = None

class WarrantyTemplateCreate(BaseModel):
    """Warranty template yaratish (reusable)"""
    name: str = Field(..., min_length=1, description="Template name (e.g., 'Ariston 2 Year Gold Warranty')")
    warranty_type: WarrantyType = WarrantyType.MANUFACTURER
    duration_months: int = Field(12, ge=1, le=120)
    coverage_description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    warranty_provider: Optional[str] = None
    is_active: bool = True

class WarrantyUpdate(BaseModel):
    """Warranty yangilash"""
    status: Optional[WarrantyStatus] = None
    coverage_description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    claim_count: Optional[int] = Field(None, ge=0)
    last_claim_date: Optional[date] = None
    notes: Optional[str] = None

class Warranty(BaseModel):
    """Warranty response"""
    id: int
    tenant_id: int
    serial_number_id: int
    warranty_type: WarrantyType
    start_date: date
    end_date: date
    duration_months: int
    status: WarrantyStatus
    coverage_description: Optional[str]
    terms_and_conditions: Optional[str]
    warranty_provider: Optional[str]
    claim_count: int
    last_claim_date: Optional[date]
    warranty_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True






