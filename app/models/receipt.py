from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class ReceiptStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class ScannedReceipt(Base):
    """Model for storing scanned receipt metadata."""
    __tablename__ = "scanned_receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    image_path = Column(String, nullable=False)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.PENDING)
    ai_response = Column(JSON, nullable=True)  # Raw AI extraction data
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)  # Linked sale after confirmation
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("app.models.user.User")
    organization = relationship("Organization", back_populates="receipts")
    items = relationship("ScannedReceiptItem", back_populates="receipt", cascade="all, delete-orphan")
    sale = relationship("app.models.sale.Sale")

class ScannedReceiptItem(Base):
    """Model for individual items extracted from scanned receipt."""
    __tablename__ = "scanned_receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("scanned_receipts.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    matched_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # If matched to existing product
    
    # Relationships
    receipt = relationship("ScannedReceipt", back_populates="items")
    product = relationship("app.models.product.Product")
