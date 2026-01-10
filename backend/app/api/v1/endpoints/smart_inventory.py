"""
Smart Inventory API Endpoints
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.api import deps
from app.models import User
from app.services.smart_inventory import (
    predict_stockouts,
    get_order_suggestions,
    get_inventory_alerts
)

router = APIRouter()


@router.get("/predictions/stockouts")
def get_stockout_predictions(
    db: Session = Depends(deps.get_db),
    days_ahead: int = 7,
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """
    Get predictions for products that will run out of stock.
    """
    if organization_id is None:
        raise HTTPException(
            status_code=400,
            detail="Organization ID required"
        )
    
    predictions = predict_stockouts(db, organization_id, days_ahead)
    return {
        'predictions': predictions,
        'count': len(predictions),
        'days_ahead': days_ahead
    }


@router.get("/suggestions/orders")
def get_order_suggestions_endpoint(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """
    Get AI-powered order suggestions.
    """
    if organization_id is None:
        raise HTTPException(
            status_code=400,
            detail="Organization ID required"
        )
    
    suggestions = get_order_suggestions(db, organization_id)
    return suggestions


@router.get("/alerts")
def get_inventory_alerts_endpoint(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """
    Get inventory alerts (low stock, out of stock, etc.).
    """
    if organization_id is None:
        raise HTTPException(
            status_code=400,
            detail="Organization ID required"
        )
    
    alerts = get_inventory_alerts(db, organization_id)
    return alerts






