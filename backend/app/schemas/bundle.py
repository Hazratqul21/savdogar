"""
Product Bundle Schemas for Plumbing & HVAC
✅ PART 2: API schemas for bundle/kit management
"""

from typing import Optional, List
from pydantic import BaseModel, Field

class BundleComponentCreate(BaseModel):
    """Bundle component yaratish"""
    component_variant_id: int = Field(..., description="Component variant ID")
    quantity: float = Field(..., gt=0, description="Quantity in bundle (supports decimals for length)")
    price_override: Optional[float] = Field(None, gt=0, description="Override price (if None, uses component price)")
    sequence: int = Field(0, ge=0, description="Display order")

class BundleComponentUpdate(BaseModel):
    """Bundle component yangilash"""
    quantity: Optional[float] = Field(None, gt=0)
    price_override: Optional[float] = Field(None, gt=0)
    sequence: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class BundleComponent(BaseModel):
    """Bundle component response"""
    id: int
    tenant_id: int
    product_id: int
    component_variant_id: int
    quantity: float
    price_override: Optional[float]
    sequence: int
    is_active: bool
    
    class Config:
        from_attributes = True

class BundleCreate(BaseModel):
    """Bundle/Kit yaratish"""
    product_id: int = Field(..., description="Bundle product ID (must be BUNDLE type)")
    components: List[BundleComponentCreate] = Field(..., min_items=1, description="Bundle components")

class BundleUpdate(BaseModel):
    """Bundle yangilash"""
    components: Optional[List[BundleComponentCreate]] = None





