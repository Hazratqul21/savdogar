from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models import Sale, SaleItem, Product, User, Customer, CustomerTransaction

router = APIRouter()

@router.get("/products/{customer_id}")
def get_product_recommendations(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    limit: int = 5,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get product recommendations for a customer based on purchase history."""
    # Get customer's purchase history
    purchased_products = db.query(SaleItem.product_id).join(Sale).join(
        CustomerTransaction, CustomerTransaction.sale_id == Sale.id
    ).filter(
        CustomerTransaction.customer_id == customer_id
    ).distinct().all()
    
    purchased_ids = [p[0] for p in purchased_products]
    
    if not purchased_ids:
        # New customer - recommend best sellers
        best_sellers = db.query(
            Product.id, Product.name, Product.price,
            func.sum(SaleItem.quantity).label("sold")
        ).join(SaleItem).group_by(Product.id).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(limit).all()
        
        return [{
            "id": p[0], "name": p[1], "price": float(p[2]),
            "reason": "Eng ko'p sotilgan"
        } for p in best_sellers]
    
    # Find products commonly bought together
    co_purchased = db.query(
        SaleItem.product_id,
        func.count(SaleItem.product_id).label("count")
    ).join(Sale).filter(
        Sale.id.in_(
            db.query(SaleItem.sale_id).filter(SaleItem.product_id.in_(purchased_ids))
        ),
        ~SaleItem.product_id.in_(purchased_ids)
    ).group_by(SaleItem.product_id).order_by(
        func.count(SaleItem.product_id).desc()
    ).limit(limit).all()
    
    recommendations = []
    for product_id, count in co_purchased:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            recommendations.append({
                "id": product.id,
                "name": product.name,
                "price": float(product.price),
                "reason": "Boshqa mijozlar ham xarid qilgan"
            })
    
    return recommendations

@router.get("/reorder")
def get_reorder_suggestions(
    db: Session = Depends(deps.get_db),
    threshold_days: int = 7,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get products that need to be reordered based on sales velocity."""
    # Calculate average daily sales for each product
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    products = db.query(Product).filter(Product.stock_quantity > 0).all()
    suggestions = []
    
    for product in products:
        # Get total sales in last 30 days
        total_sold = db.query(func.sum(SaleItem.quantity)).join(Sale).filter(
            SaleItem.product_id == product.id,
            Sale.created_at >= start_date
        ).scalar() or 0
        
        avg_daily = float(total_sold) / 30
        days_of_stock = product.stock_quantity / avg_daily if avg_daily > 0 else 999
        
        if days_of_stock <= threshold_days:
            # Calculate suggested order quantity (2 weeks supply)
            suggested_qty = max(0, (avg_daily * 14) - product.stock_quantity)
            
            suggestions.append({
                "id": product.id,
                "name": product.name,
                "current_stock": product.stock_quantity,
                "avg_daily_sales": round(avg_daily, 2),
                "days_of_stock": round(days_of_stock, 1),
                "suggested_order_qty": round(suggested_qty),
                "urgency": "critical" if days_of_stock <= 3 else "high" if days_of_stock <= 5 else "medium"
            })
    
    # Sort by urgency
    suggestions.sort(key=lambda x: x["days_of_stock"])
    
    return {
        "suggestions": suggestions,
        "summary": {
            "critical": len([s for s in suggestions if s["urgency"] == "critical"]),
            "high": len([s for s in suggestions if s["urgency"] == "high"]),
            "medium": len([s for s in suggestions if s["urgency"] == "medium"]),
        }
    }

@router.get("/bundles")
def get_bundle_suggestions(
    db: Session = Depends(deps.get_db),
    min_frequency: int = 3,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Find products frequently bought together for bundle deals."""
    # Get all sales with multiple items
    sales_with_multiple = db.query(Sale.id).join(SaleItem).group_by(Sale.id).having(
        func.count(SaleItem.id) >= 2
    ).all()
    
    sale_ids = [s[0] for s in sales_with_multiple]
    
    if not sale_ids:
        return {"bundles": []}
    
    # Find product pairs
    pairs = {}
    for sale_id in sale_ids[:100]:  # Limit for performance
        items = db.query(SaleItem.product_id).filter(SaleItem.sale_id == sale_id).all()
        product_ids = [i[0] for i in items]
        
        for i, p1 in enumerate(product_ids):
            for p2 in product_ids[i+1:]:
                key = tuple(sorted([p1, p2]))
                pairs[key] = pairs.get(key, 0) + 1
    
    # Filter and format bundles
    bundles = []
    for (p1_id, p2_id), count in pairs.items():
        if count >= min_frequency:
            p1 = db.query(Product).filter(Product.id == p1_id).first()
            p2 = db.query(Product).filter(Product.id == p2_id).first()
            
            if p1 and p2:
                bundles.append({
                    "products": [
                        {"id": p1.id, "name": p1.name, "price": float(p1.price)},
                        {"id": p2.id, "name": p2.name, "price": float(p2.price)},
                    ],
                    "frequency": count,
                    "total_price": float(p1.price + p2.price),
                    "suggested_bundle_price": round(float(p1.price + p2.price) * 0.9, 2)
                })
    
    bundles.sort(key=lambda x: x["frequency"], reverse=True)
    
    return {"bundles": bundles[:10]}
