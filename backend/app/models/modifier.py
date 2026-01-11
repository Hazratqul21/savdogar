"""
Product Modifiers Model
=======================
Cafe/Restoran uchun mahsulot modifikatorlari.
Masalan: Shakar (kam/o'rta/ko'p), Sut (oddiy/soya/bodom), etc.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.core.database import Base


class ModifierGroup(Base):
    """
    Modifikator guruhi
    Masalan: "Shakar miqdori", "Sut turi", "Qo'shimchalar"
    """
    __tablename__ = "modifier_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Asosiy ma'lumotlar
    name = Column(String, nullable=False)  # "Shakar miqdori"
    display_name = Column(String, nullable=True)  # "Shakar"
    
    # Tanlash qoidalari
    is_required = Column(Boolean, default=False)  # Majburiy tanlashmi?
    min_selections = Column(Integer, default=0)  # Minimal tanlash
    max_selections = Column(Integer, default=1)  # Maksimal tanlash (1 = radio, >1 = checkbox)
    
    # Tartib
    sort_order = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    options = relationship("ModifierOption", back_populates="group", cascade="all, delete-orphan")
    products = relationship("ProductModifier", back_populates="modifier_group")


class ModifierOption(Base):
    """
    Modifikator varianti
    Masalan: "Shakar miqdori" guruhida: "Kam", "O'rta", "Ko'p"
    """
    __tablename__ = "modifier_options"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("modifier_groups.id"), nullable=False, index=True)
    
    # Asosiy ma'lumotlar
    name = Column(String, nullable=False)  # "Kam"
    display_name = Column(String, nullable=True)  # "Shakar kam"
    
    # Narx (qo'shimcha narx)
    price_adjustment = Column(Float, default=0.0)  # +5000 so'm
    
    # Default tanlovmi?
    is_default = Column(Boolean, default=False)
    
    # Tartib
    sort_order = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship("ModifierGroup", back_populates="options")


class ProductModifier(Base):
    """
    Mahsulot va Modifikator guruhini bog'lash
    Qaysi mahsulotga qaysi modifikatorlar tegishli
    """
    __tablename__ = "product_modifiers"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products_v2.id"), nullable=False, index=True)
    modifier_group_id = Column(Integer, ForeignKey("modifier_groups.id"), nullable=False, index=True)
    
    # Tartib (mahsulot ichida)
    sort_order = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    product = relationship("ProductV2")
    modifier_group = relationship("ModifierGroup", back_populates="products")
