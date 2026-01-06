"""
Double-Entry Inventory System Models
====================================

Enterprise-grade inventory tracking inspired by Odoo's stock module.
Implements double-entry accounting for inventory movements.

Key Concepts:
- StockLocation: Physical locations (warehouses, stores, suppliers, customers)
- StockMove: Planned or executed inventory movements
- StockQuant: Double-entry quant records (negative at source, positive at destination)
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum,
    Index, CheckConstraint, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from datetime import datetime
from decimal import Decimal
import enum
import uuid


class MoveState(str, enum.Enum):
    """State of a stock move"""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    ASSIGNED = "assigned"
    DONE = "done"
    CANCELLED = "cancelled"


class QuantStatus(str, enum.Enum):
    """Status of a quant"""
    AVAILABLE = "available"
    RESERVED = "reserved"
    IN_TRANSIT = "in_transit"


class StockLocation(Base):
    """
    Represents a physical location where inventory can be stored.
    
    Locations can be:
    - 'internal': Warehouses, stores
    - 'supplier': Supplier locations
    - 'customer': Customer locations
    - 'inventory': Virtual location for inventory adjustments
    - 'transit': In-transit location
    """
    __tablename__ = "stock_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)  # Unique per tenant
    parent_id = Column(Integer, ForeignKey("stock_locations.id"), nullable=True)
    
    usage = Column(String(50), nullable=False, default="internal")  # internal, supplier, customer, inventory, transit
    
    # Metadata
    address = Column(Text, nullable=True)
    is_active = Column(String(10), default="1", nullable=False)  # Match existing pattern (String "1"/"0")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    parent = relationship("StockLocation", remote_side=[id], backref="children")
    quants = relationship("StockQuant", back_populates="location")
    source_moves = relationship("StockMove", foreign_keys="StockMove.location_id", back_populates="source_location")
    dest_moves = relationship("StockMove", foreign_keys="StockMove.location_dest_id", back_populates="dest_location")
    
    __table_args__ = (
        Index("idx_location_tenant_code", "tenant_id", "code", unique=True),
        Index("idx_location_usage", "usage"),
    )


class StockLot(Base):
    """
    Represents a batch/lot number for tracking.
    
    Used for products that are tracked by lot/batch numbers.
    """
    __tablename__ = "stock_lots"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)  # Lot/batch number
    product_id = Column(Integer, ForeignKey("products_v2.id"), nullable=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True, index=True)
    
    # Expiry tracking
    expiry_date = Column(DateTime, nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    
    __table_args__ = (
        Index("idx_lot_tenant_name", "tenant_id", "name"),
    )


class StockMove(Base):
    """
    Represents a movement of inventory from one location to another.
    
    This is the core of the double-entry system. When a move is executed,
    it creates two quant adjustments:
    1. Negative adjustment at source location
    2. Positive adjustment at destination location
    """
    __tablename__ = "stock_moves"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    reference = Column(String(255), nullable=True, index=True)
    
    # Product reference (supports both legacy Product and ProductVariant)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)  # Legacy Product
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True, index=True)  # ProductVariant
    
    # Location references
    location_id = Column(Integer, ForeignKey("stock_locations.id"), nullable=False, index=True)
    location_dest_id = Column(Integer, ForeignKey("stock_locations.id"), nullable=False, index=True)
    
    # Quantities
    product_uom_qty = Column(Numeric(18, 6), nullable=False)  # Planned quantity
    quantity_done = Column(Numeric(18, 6), default=0)  # Actually moved quantity
    
    # State
    state = Column(Enum(MoveState), default=MoveState.DRAFT, nullable=False, index=True)
    
    # Tracking
    lot_id = Column(Integer, ForeignKey("stock_lots.id"), nullable=True, index=True)
    package_id = Column(Integer, nullable=True)
    owner_id = Column(Integer, nullable=True)  # For consignment inventory
    
    # Timestamps
    date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    date_done = Column(DateTime, nullable=True)
    
    # Origin tracking
    origin = Column(String(255), nullable=True)  # Reference to source document (e.g., "SO001")
    
    # Reference to legacy system
    inventory_movement_id = Column(Integer, ForeignKey("inventory_movements.id"), nullable=True)  # Link to legacy movement
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    product = relationship("Product", foreign_keys=[product_id])
    variant = relationship("ProductVariant", foreign_keys=[variant_id])
    source_location = relationship("StockLocation", foreign_keys=[location_id], back_populates="source_moves")
    dest_location = relationship("StockLocation", foreign_keys=[location_dest_id], back_populates="dest_moves")
    lot = relationship("StockLot")
    quants = relationship("StockQuant", back_populates="move")
    
    __table_args__ = (
        Index("idx_move_product_location", "variant_id", "location_id", "location_dest_id", "state"),
        Index("idx_move_state_date", "state", "date"),
        Index("idx_move_tenant", "tenant_id", "state"),
        CheckConstraint("product_uom_qty >= 0", name="check_positive_uom_qty"),
        CheckConstraint("quantity_done >= 0", name="check_positive_done_qty"),
        CheckConstraint(
            "(product_id IS NOT NULL) OR (variant_id IS NOT NULL)",
            name="check_move_has_product"
        ),
    )


class StockQuant(Base):
    """
    Represents actual inventory quantity at a specific location.
    
    This is the "account" in the double-entry system. Each quant tracks:
    - Product/Variant
    - Location
    - Quantity (can be negative in transit scenarios, but typically positive for available stock)
    - Reserved quantity (for pending moves)
    - Lot/Serial number (if tracked)
    
    Key principle: Quants are immutable records. To move inventory,
    you create a StockMove which generates new quants.
    """
    __tablename__ = "stock_quants"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Product reference
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)  # Legacy Product
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True, index=True)  # ProductVariant
    
    location_id = Column(Integer, ForeignKey("stock_locations.id"), nullable=False, index=True)
    
    # Quantities
    quantity = Column(Numeric(18, 6), nullable=False, default=0)
    reserved_quantity = Column(Numeric(18, 6), nullable=False, default=0)
    
    # Tracking
    lot_id = Column(Integer, ForeignKey("stock_lots.id"), nullable=True, index=True)
    package_id = Column(Integer, nullable=True, index=True)
    owner_id = Column(Integer, nullable=True, index=True)
    
    # Status
    status = Column(Enum(QuantStatus), default=QuantStatus.AVAILABLE, nullable=False)
    
    # Timestamps
    in_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Link to move that created this quant
    move_id = Column(Integer, ForeignKey("stock_moves.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    product = relationship("Product", foreign_keys=[product_id])
    variant = relationship("ProductVariant", foreign_keys=[variant_id])
    location = relationship("StockLocation", back_populates="quants")
    move = relationship("StockMove", back_populates="quants")
    lot = relationship("StockLot")
    
    __table_args__ = (
        Index("idx_quant_product_location", "variant_id", "location_id", "lot_id", "package_id", "owner_id"),
        Index("idx_quant_location_status", "location_id", "status"),
        Index("idx_quant_tenant", "tenant_id"),
        CheckConstraint(
            "(product_id IS NOT NULL) OR (variant_id IS NOT NULL)",
            name="check_quant_has_product"
        ),
    )




