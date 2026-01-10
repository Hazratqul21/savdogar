"""
AI Recommendations API Endpoints
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.services.ai_recommendations import (
    get_product_recommendations_for_sale,
    get_ai_pricing_suggestions
)
from pydantic import BaseModel

router = APIRouter()


class CartItem(BaseModel):
    product_id: int
    quantity: float
    unit_price: float


class RecommendationRequest(BaseModel):
    cart_items: List[CartItem]
    customer_id: int = None


@router.post("/products/sale")
def get_sale_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI-powered product recommendations for current sale.
    """
    try:
        cart_data = [
            {
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': item.unit_price
            }
            for item in request.cart_items
        ]
        
        recommendations = get_product_recommendations_for_sale(
            db,
            cart_data,
            request.customer_id
        )
        
        return {
            'recommendations': recommendations,
            'count': len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")


@router.get("/products/{product_id}/pricing")
def get_pricing_suggestions(
    product_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI-powered pricing suggestions for a product.
    """
    try:
        suggestions = get_ai_pricing_suggestions(db, product_id)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")








