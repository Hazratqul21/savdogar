from sqlalchemy import Column, Integer, String, Boolean, Enum, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    OWNER = "owner"
    MANAGER = "manager"
    CASHIER = "cashier"
    WAREHOUSE_MANAGER = "warehouse_manager"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CASHIER)
    is_active = Column(Boolean, default=True)
    
    # New Profile Fields
    full_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    pin_code_hash = Column(String, nullable=True)  # For quick login
    profile_image = Column(String, nullable=True)
    address = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    passport_data = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    hired_date = Column(Date, default=datetime.utcnow)
    
    # UI/Personalization Settings
    # {"theme": "glass", "language": "uz", "dashboard_layout": ["sales", "stock", "ai"]}
    user_settings = Column(JSONB, nullable=True, default={})
    
    # Organization relationship (legacy)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Tenant relationship (new multi-tenant)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    tenant = relationship("Tenant", back_populates="users")
    work_sessions = relationship("WorkSession", back_populates="user")
    attendance_records = relationship("Attendance", back_populates="user")
    documents = relationship("EmployeeDocument", back_populates="user")
    ai_insights = relationship("EmployeeAIInsights", back_populates="user")
