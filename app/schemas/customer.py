from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    ai_preferences: Optional[Dict[str, Any]] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None
    phone: Optional[str] = None

class Customer(CustomerBase):
    id: int
    loyalty_points: float = 0.0
    created_at: datetime
    
    class Config:
        from_attributes = True

class CustomerTransaction(BaseModel):
    id: int
    customer_id: int
    sale_id: Optional[int] = None
    amount: float
    points_earned: float
    points_used: float
    transaction_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoyaltyPointsAdd(BaseModel):
    points: float
    reason: str = "manual"

class LoyaltyPointsUse(BaseModel):
    points: float
