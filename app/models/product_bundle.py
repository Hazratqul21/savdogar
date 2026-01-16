"""
Product Bundle/Kit Model for Plumbing & HVAC
✅ PART 2: Support for selling bundles/kits (1 Boiler + 5 Radiators + 20m Pipe)
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductBundle(Base):
    """
    Product Bundle/Kit - Plumbing & HVAC uchun
    Bir nechta mahsulotlarni bitta to'plam sifatida sotish
    Masalan: "Heating System Kit" = 1 Boiler + 5 Radiators + 20m Pipe
    """
    __tablename__ = "product_bundles"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products_v2.id"), nullable=False, index=True)  # Bundle product
    
    # Bundle Item (component)
    component_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False, index=True)
    
    # Quantity in bundle
    quantity = Column(Float, nullable=False, default=1.0)  # Decimal support for length-based items (e.g., 1.5 meters)
    
    # Optional: Override price for this component in bundle
    price_override = Column(Float, nullable=True)  # If null, uses component's regular price
    
    # Order/Sequence in bundle (for display)
    sequence = Column(Integer, default=0, nullable=False)  # Display order
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    tenant = relationship("Tenant")
    product = relationship("ProductV2", foreign_keys=[product_id], back_populates="bundles")
    component_variant = relationship("ProductVariant", foreign_keys=[component_variant_id], back_populates="bundle_components")
    
    # Indexes
    __table_args__ = (
        Index('idx_bundle_product', 'product_id', 'sequence'),
        Index('idx_bundle_tenant', 'tenant_id'),
    )

