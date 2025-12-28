from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class CustomerTier(str, enum.Enum):
    """Mijoz darajalari"""
    RETAIL = "retail"           # Oddiy mijoz
    VIP = "vip"                 # VIP mijoz
    WHOLESALER = "wholesaler"   # Optovaya mijoz

class PaymentMethod(str, enum.Enum):
    """To'lov usullari"""
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    DEBT = "debt"               # Nasiya/Qarz
    MIXED = "mixed"
    PAYME = "payme"
    CLICK = "click"

class CustomerV2(Base):
    """
    Mijozlar jadvali - Wholesale uchun balance (qarz) boshqaruvi
    """
    __tablename__ = "customers_v2"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Asosiy ma'lumotlar
    name = Column(String, nullable=False, index=True)
    phone = Column(String, index=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    # Mijoz darajasi
    price_tier = Column(Enum(CustomerTier), default=CustomerTier.RETAIL, nullable=False)
    
    # Balance (Qarz boshqaruvi)
    # Positive = Credit (mijozda pul bor)
    # Negative = Debt (mijoz qarzdor)
    balance = Column(Float, default=0.0, nullable=False)
    
    # Qarz limitlari (Wholesale uchun)
    credit_limit = Column(Float, default=0.0)  # Maksimal qarz miqdori
    max_debt_allowed = Column(Float, default=0.0)  # Ruxsat etilgan maksimal qarz
    
    # Loyalty
    loyalty_points = Column(Float, default=0.0)
    
    # AI preferences
    ai_preferences = Column(JSONB, nullable=True)
    
    # Metadata
    customer_metadata = Column("metadata", JSONB, nullable=True, default={})
    # Wholesale: {"tax_id": "123456789", "payment_terms": "net_30"}
    # Retail: {"preferred_payment": "card", "loyalty_tier": "gold"}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customers")
    transactions = relationship("CustomerTransactionV2", back_populates="customer_v2")
    ledger_entries = relationship("CustomerLedger", back_populates="customer_v2")
    
    # Indexes
    __table_args__ = (
        Index('idx_customers_tenant_phone', 'tenant_id', 'phone'),
        Index('idx_customers_tier', 'price_tier'),
    )

class CustomerTransactionV2(Base):
    """
    Mijoz tranzaksiyalari
    """
    __tablename__ = "customer_transactions_v2"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers_v2.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales_v2.id"), nullable=True, index=True)
    
    # Tranzaksiya ma'lumotlari
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # sale, payment, refund, adjustment
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    
    # Points
    points_earned = Column(Float, default=0.0)
    points_used = Column(Float, default=0.0)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer_v2 = relationship("CustomerV2", back_populates="transactions")
    sale = relationship("SaleV2")

class CustomerLedger(Base):
    """
    Mijozlar qarz kitobi (Wholesale uchun)
    Har bir qarz/pul o'tkazish yozuvi
    """
    __tablename__ = "customer_ledger"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers_v2.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales_v2.id"), nullable=True)
    
    # Tranzaksiya
    debit = Column(Float, default=0.0)   # Qarz (mijoz qarzdor bo'ldi)
    credit = Column(Float, default=0.0)  # To'lov (mijoz to'ladi)
    balance_after = Column(Float, nullable=False)  # Tranzaksiyadan keyingi balance
    
    # Ma'lumotlar
    description = Column(Text, nullable=True)
    reference_number = Column(String, nullable=True)  # Invoice number, Receipt number
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    customer_v2 = relationship("CustomerV2", back_populates="ledger_entries", foreign_keys=[customer_id])
    sale = relationship("SaleV2", foreign_keys=[sale_id])
    creator = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_ledger_customer_date', 'customer_id', 'created_at'),
    )








