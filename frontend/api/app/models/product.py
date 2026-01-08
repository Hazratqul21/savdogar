from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, backref
from app.core.database import Base
import sqlalchemy

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    products = relationship("Product", back_populates="category")
    subcategories = relationship("Category", backref=backref('parent', remote_side=[id]))

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    barcode = Column(String, index=True, nullable=True)  # Removed unique - can be same across orgs
    sku = Column(String, index=True, nullable=True)
    embedding_vector = Column(ARRAY(Float), nullable=True) # For semantic search
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    stock_quantity = Column(Float, default=0.0)
    unit = Column(String, default="dona") # dona, kg, litr
    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Adaptive Fields (JSONB)
    # Retail: {"expiry_date": "2024-12-31", "brand": "Nestle"}
    # Fashion: {"size": "L", "color": "Red", "material": "Cotton", "season": "Winter 24"}
    # Jewelry: {"weight": 5.4, "purity": "585", "stone": "Diamond"}
    attributes = Column(JSONB, default={})

    category = relationship("Category", back_populates="products")
    organization = relationship("Organization", back_populates="products")
