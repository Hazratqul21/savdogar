from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text, Boolean, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class PaymentMethod(str, enum.Enum):
    """To'lov usullari"""
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    DEBT = "debt"               # Nasiya/Qarz
    MIXED = "mixed"
    PAYME = "payme"
    CLICK = "click"

class SaleStatus(str, enum.Enum):
    """Sotuv holati"""
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class SaleV2(Base):
    """
    Sotuvlar jadvali - Variant-based system
    """
    __tablename__ = "sales_v2"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers_v2.id"), nullable=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    
    # Sotuv ma'lumotlari
    total_amount = Column(Float, default=0.0, nullable=False)
    subtotal = Column(Float, default=0.0)  # Soliqdan oldin
    tax_amount = Column(Float, default=0.0)  # Soliq summasi
    discount_amount = Column(Float, default=0.0)  # Chegirma
    service_charge = Column(Float, default=0.0) # Xizmat haqi (Horeca bo'limi uchun)
    
    # To'lov
    payment_method = Column(String, default="cash", nullable=False)
    status = Column(String, default="completed", nullable=False)
    
    # Qarz ma'lumotlari (agar payment_method = DEBT)
    is_debt = Column(Boolean, default=False, index=True)
    debt_amount = Column(Float, default=0.0)  # Qarz miqdori
    
    # Metadata
    notes = Column(Text, nullable=True)
    receipt_number = Column(String, nullable=True, index=True)  # Unique receipt number
    
    # Industry-specific metadata (JSONB)
    # Horeca/Cafe: {"table_number": 5, "parked": true, "kitchen_ticket_printed": true}
    # Wholesale: {"credit_approved": true, "tier_used": "B"}
    # Tobacco: {"age_verified": true, "mgc_compliant": true}
    # Kitchen: {"recipe_ingredients_deducted": true}
    sale_metadata = Column("metadata", JSONB, nullable=True, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    cashier = relationship("User")
    customer = relationship("CustomerV2")
    branch = relationship("Branch")
    items = relationship("SaleItemV2", back_populates="sale_v2", cascade="all, delete-orphan")
    ledger_entries = relationship("CustomerLedger", back_populates="sale")
    
    # Indexes
    __table_args__ = (
        Index('idx_sales_tenant_date', 'tenant_id', 'created_at'),
        Index('idx_sales_customer', 'customer_id'),
        Index('idx_sales_debt', 'is_debt', 'status'),
    )

class SaleItemV2(Base):
    """
    Sotuv elementlari - Variant-based
    """
    __tablename__ = "sale_items_v2"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales_v2.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False, index=True)
    
    # Miqdor va narx
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False)  # Sotilgan narx (price tier dan olingan)
    cost_price = Column(Float, default=0.0)  # Xarajat narxi
    total = Column(Float, nullable=False)  # quantity * unit_price
    
    # Chegirma
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    
    # Soliq
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    
    # ✅ PART 2: Serial Number Tracking (Plumbing/HVAC)
    serial_number_id = Column(Integer, ForeignKey("serial_numbers.id"), nullable=True, index=True)
    
    # ✅ PART 2: Service Item Tracking
    is_service_item = Column(Boolean, default=False, index=True)  # Xizmat mahsulotimi?
    linked_sale_item_id = Column(Integer, ForeignKey("sale_items_v2.id"), nullable=True)  # Bog'langan mahsulot (service -> product)
    
    # Metadata
    notes = Column(Text, nullable=True)
    
    # Industry-specific metadata (JSONB)
    # Fashion: {"size": "XL", "color": "Red", "return_policy_applied": true}
    # Horeca: {"modifiers": {"sugar": 2, "milk": "soy"}, "special_instructions": "no onions"}
    # Tobacco: {"unit_sold": "pack", "block_opened": false, "conversion_applied": true}
    # Kitchen: {"recipe_applied": true, "ingredients_deducted": {...}}
    item_metadata = Column("metadata", JSONB, nullable=True, default={})
    
    # Relationships
    sale_v2 = relationship("SaleV2", back_populates="items")
    variant = relationship("ProductVariant", back_populates="sale_items", foreign_keys=[variant_id])
    serial_number = relationship("SerialNumber", foreign_keys=[serial_number_id])
    linked_item = relationship("SaleItemV2", remote_side=[id], foreign_keys=[linked_sale_item_id])  # Self-referential for service links
    
    # Indexes
    __table_args__ = (
        Index('idx_sale_items_variant', 'variant_id'),
    )

    @property
    def product_name(self):
        if self.variant and self.variant.product_v2:
            return self.variant.product_v2.name
        return "Noma'lum mahsulot"

    @property
    def sku(self):
        if self.variant:
            return self.variant.sku
        return ""








