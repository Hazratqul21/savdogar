"""
Audit Logs Model
✅ AI Audit & Automation - Tracks AI-detected anomalies and audit findings
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Index, Float, JSON, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class AuditSeverity(str, enum.Enum):
    """Audit finding severity levels"""
    LOW = "low"           # Minor issues, informational
    MEDIUM = "medium"     # Moderate concerns
    CRITICAL = "critical" # Serious issues requiring immediate attention

class AuditCategory(str, enum.Enum):
    """Audit finding categories"""
    DISCOUNT_ANOMALY = "discount_anomaly"      # Suspicious discount patterns
    INVENTORY_MISMATCH = "inventory_mismatch"  # Negative stock, discrepancies
    TRANSACTION_ANOMALY = "transaction_anomaly" # Unusual transaction patterns
    STOCK_CORRECTION = "stock_correction"      # AI-suggested stock fixes
    CASHIER_BEHAVIOR = "cashier_behavior"      # Unusual cashier activity
    PRICING_ANOMALY = "pricing_anomaly"        # Pricing inconsistencies
    OTHER = "other"

class AuditLog(Base):
    """
    AI Audit Logs - Records findings from automated audit scans
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Audit finding details
    category = Column(Enum(AuditCategory), nullable=False, index=True)
    severity = Column(Enum(AuditSeverity), nullable=False, index=True)
    title = Column(String, nullable=False)  # Short summary
    description = Column(Text, nullable=False)  # Detailed description
    
    # Context data (JSONB for flexible storage)
    context_data = Column(JSONB, nullable=True)  # Related IDs, amounts, timestamps, etc.
    
    # Related entities (optional)
    related_sale_id = Column(Integer, ForeignKey("sales_v2.id"), nullable=True, index=True)
    related_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True, index=True)
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Cashier
    
    # AI metadata
    ai_confidence = Column(Float, nullable=True)  # AI confidence score (0-1)
    ai_reasoning = Column(Text, nullable=True)   # AI's reasoning for this finding
    
    # Resolution
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    related_sale = relationship("SaleV2")
    related_variant = relationship("ProductVariant")
    related_user = relationship("User", foreign_keys=[related_user_id])
    resolved_by_user = relationship("User", foreign_keys=[resolved_by])
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_logs_tenant_severity', 'tenant_id', 'severity'),
        Index('idx_audit_logs_tenant_category', 'tenant_id', 'category'),
        Index('idx_audit_logs_unresolved', 'tenant_id', 'is_resolved', 'severity'),
        Index('idx_audit_logs_created', 'created_at'),
    )

