from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Organization(Base):
    """Organization/Shop model - har bir do'kon egasi uchun"""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    products = relationship("Product", back_populates="organization")
    sales = relationship("Sale", back_populates="organization")
    customers = relationship("Customer", back_populates="organization")
    invoices = relationship("Invoice", back_populates="organization")
    receipts = relationship("ScannedReceipt", back_populates="organization")
    branches = relationship("Branch", back_populates="organization")

