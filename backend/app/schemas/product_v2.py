from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from app.models.product_v2 import ProductType
from app.models.pricing import PriceTierType

# ==================== Product Variant Schemas ====================

class ProductVariantAttributes(BaseModel):
    """Variant atributlari - Flexible JSONB structure"""
    # Fashion
    size: Optional[str] = None
    color: Optional[str] = None
    fabric: Optional[str] = None
    material_code: Optional[str] = None
    
    # Grocery
    expiry_date: Optional[str] = None
    weight: Optional[str] = None
    batch: Optional[str] = None
    
    # Horeca
    portion: Optional[str] = None
    spice_level: Optional[str] = None
    dietary: Optional[str] = None
    
    # Wholesale
    pack_size: Optional[int] = None
    inner_sku: Optional[str] = None
    pallet_qty: Optional[int] = None
    
    class Config:
        extra = "allow"  # Qo'shimcha maydonlarga ruxsat beradi

class ProductVariantCreate(BaseModel):
    """Variant yaratish"""
    sku: str = Field(..., description="SKU kodi (tenant ichida unique)")
    price: float = Field(..., gt=0, description="Narx")
    cost_price: Optional[float] = Field(0.0, ge=0)
    stock_quantity: float = Field(0.0, ge=0)
    min_stock_level: Optional[float] = Field(0.0, ge=0)
    max_stock_level: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    barcode_aliases: Optional[List[str]] = Field(default_factory=list)
    is_active: bool = True

class ProductVariantUpdate(BaseModel):
    """Variant yangilash"""
    sku: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    cost_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[float] = Field(None, ge=0)
    attributes: Optional[Dict[str, Any]] = None
    barcode_aliases: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ProductVariant(BaseModel):
    """Variant response"""
    id: int
    product_id: int
    tenant_id: int
    sku: str
    price: float
    cost_price: float
    stock_quantity: float
    attributes: Dict[str, Any]
    barcode_aliases: List[str]
    is_active: bool
    
    class Config:
        from_attributes = True

# ==================== Product Schemas ====================

class ProductMetadata(BaseModel):
    """Product metadata - Flexible JSONB"""
    # Retail
    brand: Optional[str] = None
    expiry_tracking: Optional[bool] = None
    
    # Fashion
    season: Optional[str] = None
    
    # Horeca
    allergens: Optional[List[str]] = None
    prep_time: Optional[int] = None
    
    # Wholesale
    moq: Optional[int] = None  # Minimum Order Quantity
    pack_type: Optional[str] = None
    
    class Config:
        extra = "allow"

class ProductCreate(BaseModel):
    """Mahsulot yaratish"""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    category_id: Optional[int] = None
    type: ProductType = ProductType.SIMPLE
    base_price: float = Field(0.0, ge=0)
    cost_price: Optional[float] = Field(0.0, ge=0)
    tax_rate: Optional[float] = Field(0.0, ge=0, le=100)
    product_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata")
    
    # Agar type = VARIABLE bo'lsa, variantlar avtomatik yaratiladi
    variants: Optional[List[ProductVariantCreate]] = None
    
    @validator('variants')
    def validate_variants(cls, v, values):
        """VARIABLE type uchun variantlar majburiy"""
        if values.get('type') == ProductType.VARIABLE and not v:
            raise ValueError("VARIABLE type mahsulot uchun kamida bitta variant kerak")
        return v

class ProductUpdate(BaseModel):
    """Mahsulot yangilash"""
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    category_id: Optional[int] = None
    base_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    product_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    is_active: Optional[bool] = None

class Product(BaseModel):
    """Product response"""
    id: int
    tenant_id: int
    category_id: Optional[int]
    name: str
    description: Optional[str]
    type: ProductType
    base_price: float
    cost_price: float
    tax_rate: float
    product_metadata: Dict[str, Any] = Field(..., alias="metadata")
    is_active: bool
    variants: List[ProductVariant] = []
    
    class Config:
        from_attributes = True

# ==================== Price Tier Schemas ====================

class PriceTierCreate(BaseModel):
    """Narx darajasi yaratish"""
    variant_id: int
    tier_type: PriceTierType = PriceTierType.RETAIL
    min_quantity: float = Field(..., gt=0)
    max_quantity: Optional[float] = Field(None, gt=0)
    price: float = Field(..., gt=0)
    customer_group: Optional[str] = None

class PriceTierUpdate(BaseModel):
    """Narx darajasi yangilash"""
    min_quantity: Optional[float] = Field(None, gt=0)
    max_quantity: Optional[float] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    customer_group: Optional[str] = None

class PriceTier(BaseModel):
    """Price tier response"""
    id: int
    variant_id: int
    tenant_id: int
    tier_type: PriceTierType
    min_quantity: float
    max_quantity: Optional[float]
    price: float
    customer_group: Optional[str]
    
    class Config:
        from_attributes = True








