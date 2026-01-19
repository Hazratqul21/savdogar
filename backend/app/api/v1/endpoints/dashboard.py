from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.product_v2 import ProductV2, ProductVariant

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get dashboard statistics using V2 models."""
    # Restrict access for cashier role
    if current_user.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan. Kassirlar tahlillarni ko'ra olmaydi."
        )
    
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")

    today = datetime.utcnow().date()
    month_start = today.replace(day=1)
    
    # Today's sales (SaleV2)
    today_sales = db.query(func.sum(SaleV2.total_amount)).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            func.date(SaleV2.created_at) == today,
            SaleV2.status == "completed"
        )
    ).scalar() or 0
    
    # Monthly sales (SaleV2)
    monthly_sales = db.query(func.sum(SaleV2.total_amount)).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= month_start,
            SaleV2.status == "completed"
        )
    ).scalar() or 0
    
    # Total products (ProductV2)
    total_products = db.query(func.count(ProductV2.id)).filter(
        ProductV2.tenant_id == tenant_id,
        ProductV2.is_active == True
    ).scalar() or 0
    
    # Low stock products (ProductVariant)
    low_stock = db.query(func.count(ProductVariant.id)).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.stock_quantity < 10,
            ProductVariant.is_active == True
        )
    ).scalar() or 0
    
    # Today's transactions (SaleV2)
    today_transactions = db.query(func.count(SaleV2.id)).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            func.date(SaleV2.created_at) == today,
            SaleV2.status == "completed"
        )
    ).scalar() or 0
    
    return {
        "today_sales": float(today_sales),
        "monthly_sales": float(monthly_sales),
        "total_products": total_products,
        "low_stock_products": low_stock,
        "today_transactions": today_transactions,
    }

@router.get("/charts")
def get_dashboard_charts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get data for dashboard charts using V2 models."""
    if current_user.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan."
        )
        
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")

    today = datetime.utcnow().date()
    
    # Last 7 days sales
    sales_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        daily_sales = db.query(func.sum(SaleV2.total_amount)).filter(
            and_(
                SaleV2.tenant_id == tenant_id,
                func.date(SaleV2.created_at) == date,
                SaleV2.status == "completed"
            )
        ).scalar() or 0
        sales_data.append({
            "date": date.isoformat(),
            "total": float(daily_sales),
        })
    
    # Top 5 products by sales
    top_products = db.query(
        ProductV2.name,
        func.sum(SaleItemV2.quantity).label("total_qty")
    ).join(ProductVariant, ProductV2.id == ProductVariant.product_id)\
     .join(SaleItemV2, ProductVariant.id == SaleItemV2.variant_id)\
     .join(SaleV2, SaleItemV2.sale_id == SaleV2.id)\
     .filter(SaleV2.tenant_id == tenant_id, SaleV2.status == "completed")\
     .group_by(ProductV2.id)\
     .order_by(func.sum(SaleItemV2.quantity).desc())\
     .limit(5).all()
    
    return {
        "sales_trend": sales_data,
        "top_products": [{"name": p[0], "quantity": float(p[1])} for p in top_products],
    }
