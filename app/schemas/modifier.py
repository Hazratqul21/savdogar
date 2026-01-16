"""
Modifier Schemas
================
Cafe modifikatorlari uchun Pydantic schemalar.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ==================== Modifier Option Schemas ====================

class ModifierOptionCreate(BaseModel):
    """Modifikator varianti yaratish"""
    name: str = Field(..., min_length=1, description="Variant nomi")
    display_name: Optional[str] = None
    price_adjustment: float = Field(0.0, ge=0, description="Qo'shimcha narx")
    is_default: bool = False
    sort_order: int = 0


class ModifierOptionUpdate(BaseModel):
    """Modifikator varianti yangilash"""
    name: Optional[str] = None
    display_name: Optional[str] = None
    price_adjustment: Optional[float] = Field(None, ge=0)
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ModifierOptionResponse(BaseModel):
    """Modifikator varianti javobi"""
    id: int
    group_id: int
    name: str
    display_name: Optional[str]
    price_adjustment: float
    is_default: bool
    sort_order: int
    is_active: bool
    
    class Config:
        from_attributes = True


# ==================== Modifier Group Schemas ====================

class ModifierGroupCreate(BaseModel):
    """Modifikator guruhi yaratish"""
    name: str = Field(..., min_length=1, description="Guruh nomi")
    display_name: Optional[str] = None
    is_required: bool = False
    min_selections: int = Field(0, ge=0)
    max_selections: int = Field(1, ge=1)
    sort_order: int = 0
    options: Optional[List[ModifierOptionCreate]] = Field(default_factory=list)


class ModifierGroupUpdate(BaseModel):
    """Modifikator guruhi yangilash"""
    name: Optional[str] = None
    display_name: Optional[str] = None
    is_required: Optional[bool] = None
    min_selections: Optional[int] = Field(None, ge=0)
    max_selections: Optional[int] = Field(None, ge=1)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ModifierGroupResponse(BaseModel):
    """Modifikator guruhi javobi"""
    id: int
    tenant_id: int
    name: str
    display_name: Optional[str]
    is_required: bool
    min_selections: int
    max_selections: int
    sort_order: int
    is_active: bool
    options: List[ModifierOptionResponse] = []
    
    class Config:
        from_attributes = True


# ==================== Product Modifier Schemas ====================

class ProductModifierCreate(BaseModel):
    """Mahsulotga modifikator qo'shish"""
    modifier_group_id: int
    sort_order: int = 0


class ProductModifierResponse(BaseModel):
    """Mahsulot modifikatori javobi"""
    id: int
    product_id: int
    modifier_group_id: int
    sort_order: int
    is_active: bool
    modifier_group: ModifierGroupResponse
    
    class Config:
        from_attributes = True


# ==================== Sale Item Modifier ====================

class SaleItemModifier(BaseModel):
    """Sotuv mahsulotidagi modifikator tanlovi"""
    group_id: int
    group_name: str
    option_id: int
    option_name: str
    price_adjustment: float
