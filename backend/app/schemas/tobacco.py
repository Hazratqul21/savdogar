"""
Tobacco-specific schemas for licensed shop operations.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class TobaccoProductMetadata(BaseModel):
    """Tobacco product metadata structure"""
    parent_product_id: Optional[int] = Field(None, description="Parent product ID for unit hierarchy")
    unit_type: str = Field(..., description="Unit type: 'pack', 'block', 'master_case'")
    conversion_chain: Dict[str, Any] = Field(
        default_factory=dict,
        description="Conversion chain: {'block_to_pack': 10, 'master_case_to_block': 50}"
    )
    mgc_price: Optional[float] = Field(None, description="Minimum Government Price (MGC)")
    brand: Optional[str] = None
    strength: Optional[str] = None  # "light", "medium", "strong"


class TobaccoSaleMetadata(BaseModel):
    """Tobacco sale metadata"""
    age_verified: bool = Field(..., description="Age verification status")
    age_verified_by: Optional[int] = Field(None, description="User ID who verified age")
    age_verified_at: Optional[datetime] = None
    mgc_compliant: bool = Field(True, description="MGC compliance check")
    license_valid: bool = Field(True, description="License validity check")


class TobaccoSaleItemMetadata(BaseModel):
    """Tobacco sale item metadata"""
    unit_sold: str = Field(..., description="Unit sold: 'pack' or 'block'")
    block_opened: bool = Field(False, description="Was a block opened for this sale?")
    conversion_applied: bool = Field(False, description="Was unit conversion applied?")
    original_unit: Optional[str] = None
    converted_quantity: Optional[float] = None


class AgeVerificationRequest(BaseModel):
    """Age verification request"""
    customer_age_verified: bool = Field(..., description="Is customer 20+ years old?")
    verified_by_user_id: Optional[int] = None


class LicenseExpiryWarning(BaseModel):
    """License expiry warning response"""
    is_valid: bool
    warning_message: Optional[str] = None
    days_until_expiry: Optional[int] = None
    expiry_date: Optional[str] = None
