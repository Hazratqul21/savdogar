from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    total_amount = Column(Float, default=0.0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING)
    
    # AI Processing fields
    image_url = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True) # Text extracted via OCR
    processed_data = Column(JSONB, nullable=True) # JSON extracted by AI
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("InvoiceItem", back_populates="invoice")
    organization = relationship("Organization", back_populates="invoices")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_name_raw = Column(String, nullable=False) # Name from OCR
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True) # Linked product
    quantity = Column(Float, default=0.0)
    price = Column(Float, default=0.0)
    
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("app.models.product.Product")
