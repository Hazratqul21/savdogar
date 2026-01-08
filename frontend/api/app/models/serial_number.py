"""
Serial Number Tracking Model for Plumbing & HVAC
✅ PART 2: Serialized inventory tracking for boilers (Ariston), equipment with warranties
Enhanced with ERPNext-style movement tracking and maintenance status
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date, Text, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, date, timedelta
from typing import Optional
import enum


class SerialNumberStatus(str, enum.Enum):
    """Status of a serial number (inspired by ERPNext)"""
    ACTIVE = "active"           # Active in inventory
    INACTIVE = "inactive"       # Inactive
    CONSUMED = "consumed"       # Consumed/used
    DELIVERED = "delivered"     # Delivered to customer
    EXPIRED = "expired"         # Expired


class MaintenanceStatus(str, enum.Enum):
    """Maintenance/warranty status (inspired by ERPNext)"""
    UNDER_WARRANTY = "under_warranty"
    OUT_OF_WARRANTY = "out_of_warranty"
    UNDER_AMC = "under_amc"     # Annual Maintenance Contract
    OUT_OF_AMC = "out_of_amc"


class SerialNumber(Base):
    """
    Serial Number Tracking - Plumbing & HVAC uchun
    Har bir boiler yoki asbobning unique serial number ni kuzatadi
    Warranty tracking uchun ishlatiladi
    
    Enhanced with:
    - Status tracking (ACTIVE, DELIVERED, etc.)
    - Maintenance status (UNDER_WARRANTY, UNDER_AMC, etc.)
    - Movement history tracking
    - AMC (Annual Maintenance Contract) support
    """
    __tablename__ = "serial_numbers"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False, index=True)
    
    # Serial Number (Unique per tenant)
    serial_number = Column(String, nullable=False, index=True, unique=False)  # Will be unique with tenant_id
    
    # Status tracking (ERPNext-style)
    status = Column(SQLEnum(SerialNumberStatus), default=SerialNumberStatus.ACTIVE, nullable=False, index=True)
    maintenance_status = Column(SQLEnum(MaintenanceStatus), nullable=True, index=True)
    
    # Location tracking
    warehouse = Column(String, nullable=True, index=True)  # Current warehouse/location
    location = Column(String, nullable=True)  # Detailed location
    
    # Sale Information
    sale_id = Column(Integer, ForeignKey("sales_v2.id"), nullable=True, index=True)
    sale_item_id = Column(Integer, ForeignKey("sale_items_v2.id"), nullable=True, index=True)
    
    # Customer Information
    customer_id = Column(Integer, ForeignKey("customers_v2.id"), nullable=True, index=True)
    
    # Warranty Information
    warranty_start_date = Column(Date, nullable=True)  # Warranty boshlanish sanasi
    warranty_duration_months = Column(Integer, nullable=True, default=12)  # Warranty muddati (oylar)
    warranty_end_date = Column(Date, nullable=True, index=True)  # Warranty tugash sanasi (calculated)
    
    # AMC (Annual Maintenance Contract) Information
    amc_start_date = Column(Date, nullable=True)
    amc_expiry_date = Column(Date, nullable=True, index=True)
    amc_provider = Column(String, nullable=True)
    
    # Installation Information (Plumbing/HVAC specific)
    installation_date = Column(Date, nullable=True)  # O'rnatilgan sana
    installation_address = Column(Text, nullable=True)  # O'rnatilgan manzil
    installer_name = Column(String, nullable=True)  # O'rnatuvchi ismi
    installer_phone = Column(String, nullable=True)  # O'rnatuvchi telefon raqami
    
    # Purchase information (for tracking)
    purchase_rate = Column(Float, nullable=True, default=0.0)
    posting_date = Column(Date, nullable=True)  # When serial was received
    
    # Reference tracking
    reference_type = Column(String(100), nullable=True)  # e.g., "Stock Entry", "Purchase Receipt"
    reference_name = Column(String(255), nullable=True, index=True)  # Document name
    
    # Status flags (backward compatibility)
    is_active = Column(Boolean, default=True, index=True)
    is_sold = Column(Boolean, default=False, index=True)  # Sotilganmi?
    is_installed = Column(Boolean, default=False, index=True)  # O'rnatilganmi?
    
    # Metadata
    notes = Column(Text, nullable=True)
    manufacturer_serial = Column(String, nullable=True)  # Ishlab chiqaruvchi serial number
    batch_number = Column(String, nullable=True, index=True)  # Partiya raqami
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    variant = relationship("ProductVariant")
    sale = relationship("SaleV2")
    sale_item = relationship("SaleItemV2", foreign_keys=[sale_item_id])
    customer = relationship("CustomerV2")
    warranties = relationship("Warranty", back_populates="serial_number", cascade="all, delete-orphan")
    movements = relationship("SerialNumberMovement", back_populates="serial_number", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_serial_tenant_number', 'tenant_id', 'serial_number', unique=True),
        Index('idx_serial_variant', 'variant_id'),
        Index('idx_serial_customer', 'customer_id'),
        Index('idx_serial_warranty', 'warranty_end_date'),
        Index('idx_serial_status_maintenance', 'status', 'maintenance_status'),
        Index('idx_serial_amc_expiry', 'amc_expiry_date'),
    )


class SerialNumberMovement(Base):
    """
    Tracks movement history of a serial number.
    
    Links serial numbers to inventory movements for full traceability.
    Inspired by ERPNext's serial number movement tracking.
    """
    __tablename__ = "serial_number_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    serial_number_id = Column(Integer, ForeignKey("serial_numbers.id"), nullable=False, index=True)
    
    # Movement reference (can link to StockMove or other systems)
    move_id = Column(Integer, nullable=True, index=True)  # Reference to stock move
    reference_type = Column(String(100), nullable=True)  # e.g., "StockMove", "Sale"
    reference_name = Column(String(255), nullable=True, index=True)  # Document name
    
    # Location tracking
    from_location = Column(String(255), nullable=True)
    to_location = Column(String(255), nullable=True)
    from_warehouse = Column(String(255), nullable=True)
    to_warehouse = Column(String(255), nullable=True)
    
    # Movement type
    movement_type = Column(String(50), nullable=False)  # 'in', 'out', 'transfer'
    
    # Timestamps
    movement_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    serial_number = relationship("SerialNumber", back_populates="movements")
    
    __table_args__ = (
        Index('idx_serial_movement_date', 'serial_number_id', 'movement_date'),
        Index('idx_serial_movement_tenant', 'tenant_id', 'movement_date'),
    )

