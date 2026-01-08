"""
Warranty Tracking Model for Plumbing & HVAC
✅ PART 2: Warranty management for serialized products (boilers, equipment)
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date, Text, Enum, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, date
import enum

class WarrantyStatus(str, enum.Enum):
    """Warranty holati"""
    ACTIVE = "active"           # Faol warranty
    EXPIRED = "expired"         # Muddati o'tgan
    VOID = "void"              # Bekor qilingan
    CLAIMED = "claimed"        # Warranty ishlatilgan

class WarrantyType(str, enum.Enum):
    """Warranty turi"""
    MANUFACTURER = "manufacturer"  # Ishlab chiqaruvchi warranty
    SELLER = "seller"              # Sotuvchi warranty
    INSTALLATION = "installation"  # O'rnatish warranty
    EXTENDED = "extended"          # Kengaytirilgan warranty

class Warranty(Base):
    """
    Warranty Tracking - Plumbing & HVAC uchun
    Har bir serial number uchun warranty ma'lumotlari
    
    Enhanced with ERPNext-style warranty tracking:
    - Warranty period in days (in addition to months)
    - Warranty terms storage
    - Better integration with serial number maintenance status
    """
    __tablename__ = "warranties"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    serial_number_id = Column(Integer, ForeignKey("serial_numbers.id"), nullable=False, index=True)
    
    # Warranty Information
    warranty_type = Column(Enum(WarrantyType), default=WarrantyType.MANUFACTURER, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    duration_months = Column(Integer, nullable=False, default=12)
    duration_days = Column(Integer, nullable=True)  # Additional precision (ERPNext-style)
    
    # Status
    status = Column(Enum(WarrantyStatus), default=WarrantyStatus.ACTIVE, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)  # Active flag (ERPNext-style)
    
    # Warranty Details
    coverage_description = Column(Text, nullable=True)  # Warranty qamrab olgan narsalar
    terms_and_conditions = Column(Text, nullable=True)  # Shartlar va qoidalar
    warranty_terms = Column(Text, nullable=True)  # Alternative field name (ERPNext-style)
    warranty_provider = Column(String, nullable=True)  # Warranty beruvchi (manufacturer, seller, etc.)
    provider = Column(String, nullable=True)  # Alternative field name (ERPNext-style)
    
    # Claims Information
    claim_count = Column(Integer, default=0)  # Warranty ishlatilgan marta
    last_claim_date = Column(Date, nullable=True)  # Oxirgi marta warranty ishlatilgan sana
    
    # Metadata
    notes = Column(Text, nullable=True)
    warranty_number = Column(String, nullable=True, index=True)  # Warranty raqami (unique)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    serial_number = relationship("SerialNumber", back_populates="warranties")
    
    # Indexes
    __table_args__ = (
        Index('idx_warranty_tenant_serial', 'tenant_id', 'serial_number_id'),
        Index('idx_warranty_status_date', 'status', 'end_date'),
        Index('idx_warranty_expiry', 'end_date', 'is_active'),
        Index('idx_warranty_number', 'warranty_number', unique=True),
    )


