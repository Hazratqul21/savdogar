from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, index=True)  # Removed unique - can be same across orgs
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    ai_preferences = Column(JSONB, nullable=True) # Metadata for AI inferred preferences
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    loyalty_points = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transactions = relationship("CustomerTransaction", back_populates="customer")
    organization = relationship("Organization", back_populates="customers")

class CustomerTransaction(Base):
    __tablename__ = "customer_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    amount = Column(Float, default=0.0)
    points_earned = Column(Float, default=0.0)
    points_used = Column(Float, default=0.0)
    transaction_type = Column(String)  # sale, points_add, points_use
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="transactions")
