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
    Get AI-powered business insights.
    Automatically analyzes sales data and provides recommendations.
    """
    insights = generate_ai_insights(db, days)
    return insights


@router.get("/ai-recommendations")
def get_ai_recommendations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get AI-powered product recommendations."""
    recommendations = get_product_recommendations(db)
    return {"recommendations": recommendations}
