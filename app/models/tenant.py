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
    JEWELRY = "jewelry"         # Bijuteriya (Accessories & Bijouterie - NOT high-end)
    CAFE = "cafe"               # Qahvaxona
    KITCHEN = "kitchen"         # Oshxona
    PLUMBING_HVAC = "plumbing_hvac"  # Sanitariya va HVAC (Boilerlar, quvurlar, xizmatlar)
    TOBACCO = "tobacco"         # Tamaki do'koni (Licensed, regulated)

class Tenant(Base):
    """
    Multi-tenant tizim uchun asosiy jadval
    Har bir tenant (tashkilot) o'z faoliyat turiga ega
    """
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    
    # New Business Logic
    # Use native_enum=False to store as VARCHAR instead of PostgreSQL ENUM type
    # This avoids case sensitivity issues between Python enum names and DB values
    business_type = Column(
        String(50),
        default="retail",
        nullable=False,
        index=True
    )
    
    # Valyuta sozlamalari (Dollar kursiga bog'liq narxlar uchun)
    base_currency = Column(String, default="UZS")
    usd_to_uzs_rate = Column(Float, default=12800.0)
    
    # Margin Guard - Minimal foyda marjasi (%)
    min_margin_percent = Column(Float, default=5.0)
    
    # Industry-specific konfiguratsiya (JSONB)
    # Retail: {"allow_negative_stock": true, "require_barcode": false, "quick_keys": true}
    # Fashion: {"size_chart": {...}, "color_variants": true, "strict_returns": true}
    # Horeca: {"print_kitchen_ticket": true, "table_service": true, "modifiers": true}
    # Wholesale: {"min_order_quantity": 10, "credit_limit": 10000, "tiered_pricing": true}
    # Jewelry: {"visual_heavy": true, "bundle_focus": true}
    # Kitchen: {"recipe_costing": true, "auto_deduct_ingredients": true}
    # Plumbing_HVAC: {"warranty_cards": true, "bundle_auto_pull": true, "serial_optional": true}
    # Tobacco: {"enforce_age_check": true, "license_expiry": "2025-12-31", "mgc_enabled": true, "mgc_prices": {}}
    config = Column(JSONB, nullable=True, default={})
    
    # Contact info
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Subscription & Plan Limits
    subscription_plan = Column(String, default="trial")  # 'trial', 'standard', 'pro'
    trial_ends_at = Column(DateTime, nullable=True)
    max_users = Column(Integer, default=5)  # Default: 5 for standard/trial, 25 for pro
    max_branches = Column(Integer, default=1)  # Default: 1 for standard/trial, 5 for pro
    
    # Onboarding Status
    onboarding_completed = Column(Boolean, default=False, index=True)
    onboarding_step = Column(Integer, default=0)  # 0-5: current step in wizard
    
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








