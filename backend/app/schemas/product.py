from typing import Optional, List
from pydantic import BaseModel

# Category schemas
class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    price: float = 0.0
    cost_price: float = 0.0
    stock_quantity: float = 0.0
    unit: str = "dona"
    image_url: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[float] = None

class Product(ProductBase):
    id: int
    category: Optional[Category] = None
    
    class Config:
        from_attributes = True
