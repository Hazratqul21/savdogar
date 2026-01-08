"""
Inventory Log Model
Tracks AI-scanned invoices and their parsed results for audit and analytics.
"""
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class InventoryLog(Base):
    """
    Logs AI-scanned invoices and their parsed results.
    Used for audit trail, analytics, and debugging.
    """
    __tablename__ = "inventory_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User and Tenant tracking
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    
    # Invoice metadata
    image_url = Column(String, nullable=False, comment="URL to the scanned invoice image in Supabase Storage")
    scan_mode = Column(String, nullable=False, comment="Scan mode: 'printed' or 'handwritten'")
    model_used = Column(String, nullable=False, comment="AI model used: 'gpt-4o-mini' or 'gpt-4o'")
    
    # Parsed results
    items_count = Column(Integer, default=0, comment="Number of items extracted")
    items_data = Column(JSON, nullable=True, comment="Full JSON array of extracted items")
    
    # Status tracking
    status = Column(String, default="pending", comment="Status: 'pending', 'verified', 'imported', 'failed'")
    error_message = Column(Text, nullable=True, comment="Error message if scan failed")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    imported_at = Column(DateTime(timezone=True), nullable=True, comment="When items were imported to inventory")
    
    # Relationships
    user = relationship("User", backref="inventory_logs")
    tenant = relationship("Tenant", backref="inventory_logs")
    
    def __repr__(self):
        return f"<InventoryLog(id={self.id}, user_id={self.user_id}, items_count={self.items_count}, status={self.status})>"
