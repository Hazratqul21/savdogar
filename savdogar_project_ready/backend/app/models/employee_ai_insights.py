from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class EmployeeAIInsights(Base):
    __tablename__ = "employee_ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    month = Column(Date, nullable=False)  # First day of the month
    performance_score = Column(Float, default=0.0)  # 0-100
    sales_rank = Column(Integer, default=0)
    recommendations = Column(JSON, nullable=True)  # List of strings
    bonus_suggestion = Column(Float, default=0.0)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="ai_insights")
