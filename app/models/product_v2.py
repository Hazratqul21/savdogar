from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Boolean, Enum, Index, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
import uuid
from datetime import date

class ProductType(str, enum.Enum):
    """Mahsulot turlari - lowercase to match PostgreSQL enum values"""
    simple = "simple"           # Oddiy mahsulot (bitta variant)
    variable = "variable"      # Variantli mahsulot (size, color, va hokazo)
    composite = "composite"    # Kompozit mahsulot (set, combo)
    service = "service"         # Xizmat (o'rnatish, texnik xizmat) - Plumbing/HVAC uchun
    bundle = "bundle"           # To'plam/Kit (1 Boiler + 5 Radiator + 20m Pipe)

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
    type = Column(Enum(ProductType), default=ProductType.simple, nullable=False)
    
    # Narxlar (base price - variantlar uchun default)
    base_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)  # Soliq foizi
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Retail: {"brand": "Coca-Cola", "expiry_tracking": true, "quick_key": "F1"}
    # Fashion: {"brand": "Nike", "season": "Spring 2025", "size_chart": {...}, "return_policy_days": 14}
    # Horeca: {"allergens": ["nuts", "dairy"], "prep_time": 15, "modifiers": {...}, "kitchen_category": "main"}
    # Wholesale: {"moq": 10, "pack_type": "carton", "tiered_pricing": {...}}
    # Jewelry: {"visual_thumbnail_url": "...", "bundle_components": [...]}
    # Kitchen: {"recipe": {...}, "auto_deduct": true}
    # Plumbing_HVAC: {"warranty_months": 12, "bundle_auto_pull": true, "serial_required": false}
    # Tobacco: {"parent_product_id": null, "unit_type": "pack", "conversion_chain": {...}, "mgc_price": 50000}
    product_metadata = Column("metadata", JSONB, nullable=True, default={})
    
    # Recipe / Ingredients (Oshxona & Cafe uchun)
    recipe = Column(JSONB, nullable=True, default={})
    
    # ✅ PART 2: Service Item Configuration (Plumbing/HVAC)
    # For SERVICE type products (installation, maintenance)
    service_duration_hours = Column(Float, nullable=True)  # Xizmat davomiyligi (soatlar)
    service_category = Column(String, nullable=True)  # Xizmat kategoriyasi (installation, repair, maintenance)
    linked_product_ids = Column(ARRAY(Integer), nullable=True)  # Bog'langan mahsulotlar (boiler + installation service)
    
    # Relationships
    tenant = relationship("Tenant")
    category = relationship("Category")
    variants = relationship("ProductVariant", back_populates="product_v2", cascade="all, delete-orphan")
    bundles = relationship("ProductBundle", foreign_keys="ProductBundle.product_id", back_populates="product", cascade="all, delete-orphan")
    
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
    
    # ✅ PART 2: Dual Unit Support (Plumbing/HVAC)
    # Primary unit (e.g., "meter" for pipes, "piece" for fittings)
    primary_unit = Column(String, default="piece", nullable=False)  # piece, meter, kg, liter, etc.
    # Secondary unit (optional, for conversion)
    secondary_unit = Column(String, nullable=True)  # e.g., "foot" for meters
    unit_conversion_factor = Column(Float, nullable=True)  # Conversion factor (e.g., 1 meter = 3.28084 feet)
    
    # ✅ PART 2: Serialized Inventory Support
    requires_serial_number = Column(Boolean, default=False, index=True)  # Serial number kerekmi? (Boilers uchun)
    is_serialized = Column(Boolean, default=False, index=True)  # Serial number bilan kuzatiladimi?
    
    # ✅ Expiry Date Tracking (Oziq-ovqat uchun)
    expiry_date = Column(Date, nullable=True, index=True)  # Yaroqlilik muddati
    batch_number = Column(String, nullable=True)  # Partiya raqami
    
    # Attributes (JSONB) - Bu muhim!
    # Fashion: {"size": "XL", "color": "Red", "fabric": "Cotton", "material_code": "COT-001"}
    # Grocery: {"expiry_date": "2025-12-01", "weight": "500g", "batch": "BATCH-123"}
    # Horeca: {"portion": "large", "spice_level": "medium", "dietary": "vegetarian"}
    # Wholesale: {"pack_size": 50, "inner_sku": "ITEM-001", "pallet_qty": 1000}
    # Plumbing/HVAC: {"material": "copper", "diameter": "1/2 inch", "pressure_rating": "PN16"}
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
    tenant = relationship("Tenant")
    price_tiers = relationship("PriceTier", back_populates="variant", cascade="all, delete-orphan")
    sale_items = relationship("SaleItemV2", back_populates="variant")
    serial_numbers = relationship("SerialNumber", back_populates="variant", cascade="all, delete-orphan")
    bundle_components = relationship("ProductBundle", foreign_keys="ProductBundle.component_variant_id", back_populates="component_variant")
    
    # Indexes
    __table_args__ = (
        Index('idx_variants_tenant_sku', 'tenant_id', 'sku', unique=True),
        Index('idx_variants_attributes', 'attributes', postgresql_using='gin'),  # GIN index for JSONB
        Index('idx_variants_barcodes', 'barcode_aliases', postgresql_using='gin'),  # GIN index for array
    )








