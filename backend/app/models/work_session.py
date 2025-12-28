from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"

class WorkSession(Base):
    __tablename__ = "work_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_minutes = Column(Float, default=0.0)
    break_minutes = Column(Integer, default=0)
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE)
    
    # Sales stats for this session
    total_sales_amount = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    
    user = relationship("User", back_populates="work_sessions")
