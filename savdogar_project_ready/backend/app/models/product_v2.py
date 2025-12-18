from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Boolean, Enum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
import uuid

class ProductType(str, enum.Enum):
    """Mahsulot turlari"""
    SIMPLE = "simple"           # Oddiy mahsulot (bitta variant)
    VARIABLE = "variable"      # Variantli mahsulot (size, color, va hokazo)
    COMPOSITE = "composite"    # Kompozit mahsulot (set, combo)

class ProductV2(Base):
    """
    Polymorphic Product Engine
    Barcha turdagi mahsulotlar uchun yagona jadval
    """
    __tablename__ = "products_v2"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Asosiy ma'lumotlar
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    type = Column(Enum(ProductType), default=ProductType.SIMPLE, nullable=False)
    
    # Narxlar (base price - variantlar uchun default)
    base_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)  # Soliq foizi
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Retail: {"brand": "Coca-Cola", "expiry_tracking": true}
    # Fashion: {"brand": "Nike", "season": "Spring 2025"}
    # Horeca: {"allergens": ["nuts", "dairy"], "prep_time": 15}
    # Wholesale: {"moq": 10, "pack_type": "carton"}
    product_metadata = Column("metadata", JSONB, nullable=True, default={})
    
    # Recipe / Ingredients (Oshxona & Cafe uchun)
    recipe = Column(JSONB, nullable=True, default={})
    
    # Relationships
    tenant = relationship("Tenant", back_populates="products")
    category = relationship("Category")
    variants = relationship("ProductVariant", back_populates="product_v2", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_products_tenant_active', 'tenant_id', 'is_active'),
    )

class ProductVariant(Base):
    """
    ProductVariants - Haqiqiy sotiladigan SKU lar
    Har bir variant o'z atributlari, narxi va omboriga ega
    """
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products_v2.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # SKU (Unique per tenant)
    sku = Column(String, nullable=False, index=True)
    
    # Narxlar (base price ni override qiladi)
    price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, default=0.0)
    
    # Ombor
    stock_quantity = Column(Float, default=0.0)
    min_stock_level = Column(Float, default=0.0)
    max_stock_level = Column(Float, nullable=True)
    
    # Attributes (JSONB) - Bu muhim!
    # Fashion: {"size": "XL", "color": "Red", "fabric": "Cotton", "material_code": "COT-001"}
    # Grocery: {"expiry_date": "2025-12-01", "weight": "500g", "batch": "BATCH-123"}
    # Horeca: {"portion": "large", "spice_level": "medium", "dietary": "vegetarian"}
    # Wholesale: {"pack_size": 50, "inner_sku": "ITEM-001", "pallet_qty": 1000}
    attributes = Column(JSONB, nullable=True, default={})
    
    # Barcode aliases (Array) - Bir nechta barcode
    # Manufacturer barcode, Internal QR code, va hokazo
    barcode_aliases = Column(ARRAY(String), nullable=True, default=[])
    
    # AI - Brain Features
    velocity_score = Column(Float, default=0.0) # Sotuv tezligi (kuniga o'rtacha)
    embedding_vector = Column(ARRAY(Float), nullable=True) # Semantic qidiruv uchun
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    product_v2 = relationship("ProductV2", back_populates="variants")
    tenant = relationship("Tenant", back_populates="product_variants")
    price_tiers = relationship("PriceTier", back_populates="variant", cascade="all, delete-orphan")
    sale_items = relationship("SaleItemV2", back_populates="variant")
    
    # Indexes
    __table_args__ = (
        Index('idx_variants_tenant_sku', 'tenant_id', 'sku', unique=True),
        Index('idx_variants_attributes', 'attributes', postgresql_using='gin'),  # GIN index for JSONB
        Index('idx_variants_barcodes', 'barcode_aliases', postgresql_using='gin'),  # GIN index for array
    )








