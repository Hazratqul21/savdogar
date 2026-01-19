"""
AI Analytics Endpoint - Automatic Business Insights
"""

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models import User
from app.services.ai_analytics import generate_ai_insights, get_product_recommendations

router = APIRouter()


@router.get("/ai-insights")
def get_ai_insights(
    db: Session = Depends(deps.get_db),
    days: int = 30,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI-powered business insights for current tenant.
    """
    tenant_id = current_user.tenant_id
    insights = generate_ai_insights(db, tenant_id, days)
    return insights


@router.get("/ai-recommendations")
def get_ai_recommendations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get AI-powered product recommendations for current tenant."""
    tenant_id = current_user.tenant_id
    recommendations = get_product_recommendations(db, tenant_id)
    return {"recommendations": recommendations}
