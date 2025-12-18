from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class PriceTierType(str, enum.Enum):
    """Narx darajalari"""
    RETAIL = "retail"           # Oddiy narx
    VIP = "vip"                 # VIP mijozlar
    WHOLESALER = "wholesaler"   # Optovaya narx
    BULK = "bulk"               # Katta hajmli sotuv

class PriceTier(Base):
    """
    Wholesale va quantity-based pricing uchun
    Miqdorga qarab narx o'zgaradi
    """
    __tablename__ = "price_tiers"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Narx darajasi
    tier_type = Column(Enum(PriceTierType), default=PriceTierType.RETAIL, nullable=False)
    
    # Miqdor shartlari
    min_quantity = Column(Float, nullable=False, default=1.0)  # Minimal miqdor
    max_quantity = Column(Float, nullable=True)  # Maksimal miqdor (NULL = cheksiz)
    
    # Narx (base price dan farq qiladi)
    price = Column(Float, nullable=False)
    
    # Mijoz guruhi (agar bo'sh bo'lsa, barcha mijozlar uchun)
    customer_group = Column(String, nullable=True)  # "wholesale", "vip", va hokazo
    
    # Relationships
    variant = relationship("ProductVariant", back_populates="price_tiers")
    tenant = relationship("Tenant", back_populates="price_tiers")
    
    # Indexes
    __table_args__ = (
        Index('idx_price_tiers_variant_quantity', 'variant_id', 'min_quantity'),
        Index('idx_price_tiers_tenant', 'tenant_id'),
    )








