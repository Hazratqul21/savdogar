from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class BusinessType(str, enum.Enum):
    """Faoliyat turlari"""
    RETAIL = "retail"           # Chakana savdo (Grocery)
    FASHION = "fashion"         # Kiyim-kechak
    HORECA = "horeca"           # Kafe/Restoran
    WHOLESALE = "wholesale"     # Optovaya (B2B)
    JEWELRY = "jewelry"         # Bijuteriya
    CAFE = "cafe"               # Qahvaxona
    KITCHEN = "kitchen"         # Oshxona

class Tenant(Base):
    """
    Multi-tenant tizim uchun asosiy jadval
    Har bir tenant (tashkilot) o'z faoliyat turiga ega
    """
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    
    # New Business Logic
    business_type = Column(Enum(BusinessType), default=BusinessType.RETAIL, nullable=False, index=True)
    
    # Valyuta sozlamalari (Dollar kursiga bog'liq narxlar uchun)
    base_currency = Column(String, default="UZS")
    usd_to_uzs_rate = Column(Float, default=12800.0)
    
    # Margin Guard - Minimal foyda marjasi (%)
    min_margin_percent = Column(Float, default=5.0)
    
    # Industry-specific konfiguratsiya (JSONB)
    # Retail: {"allow_negative_stock": true, "require_barcode": false}
    # Fashion: {"size_chart": {...}, "color_variants": true}
    # Horeca: {"print_kitchen_ticket": true, "table_service": true}
    # Wholesale: {"min_order_quantity": 10, "credit_limit": 10000}
    config = Column(JSONB, nullable=True, default={})
    
    # Contact info
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    # products = relationship("ProductV2", back_populates="tenant")
    # product_variants = relationship("ProductVariant", back_populates="tenant")
    # sales = relationship("SaleV2", back_populates="tenant")
    # customers = relationship("CustomerV2", back_populates="tenant")
    # price_tiers = relationship("PriceTier", back_populates="tenant")








