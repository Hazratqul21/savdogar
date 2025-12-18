from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    MIXED = "mixed"
    PAYME = "payme"
    CLICK = "click"

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    cashier_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    total_amount = Column(Float, default=0.0)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("SaleItem", back_populates="sale")
    cashier = relationship("app.models.user.User")
    organization = relationship("Organization", back_populates="sales")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, default=1.0)
    price = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

    sale = relationship("Sale", back_populates="items")
    product = relationship("app.models.product.Product")
