from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models import Sale, SaleItem, Product, User, Invoice
from typing import Optional

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Get dashboard statistics."""
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)
    
    # Build filters
    sale_filters = []
    product_filters = []
    if organization_id is not None:
        sale_filters.append(Sale.organization_id == organization_id)
        product_filters.append(Product.organization_id == organization_id)
    
    # Today's sales
    today_sales_query = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.created_at) == today
    )
    if sale_filters:
        today_sales_query = today_sales_query.filter(*sale_filters)
    today_sales = today_sales_query.scalar() or 0
    
    # Monthly sales
    monthly_sales_query = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= month_start
    )
    if sale_filters:
        monthly_sales_query = monthly_sales_query.filter(*sale_filters)
    monthly_sales = monthly_sales_query.scalar() or 0
    
    # Total products
    total_products_query = db.query(func.count(Product.id))
    if product_filters:
        total_products_query = total_products_query.filter(*product_filters)
    total_products = total_products_query.scalar() or 0
    
    # Low stock products
    low_stock_query = db.query(func.count(Product.id)).filter(
        Product.stock_quantity < 10
    )
    if product_filters:
        low_stock_query = low_stock_query.filter(*product_filters)
    low_stock = low_stock_query.scalar() or 0
    
    # Today's transactions
    today_transactions_query = db.query(func.count(Sale.id)).filter(
        func.date(Sale.created_at) == today
    )
    if sale_filters:
        today_transactions_query = today_transactions_query.filter(*sale_filters)
    today_transactions = today_transactions_query.scalar() or 0
    
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
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """Get data for dashboard charts."""
    today = datetime.utcnow().date()
    
    # Build filters
    sale_filters = []
    if organization_id is not None:
        sale_filters.append(Sale.organization_id == organization_id)
    
    # Last 7 days sales
    sales_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        daily_sales_query = db.query(func.sum(Sale.total_amount)).filter(
            func.date(Sale.created_at) == date
        )
        if sale_filters:
            daily_sales_query = daily_sales_query.filter(*sale_filters)
        daily_sales = daily_sales_query.scalar() or 0
        sales_data.append({
            "date": date.isoformat(),
            "total": float(daily_sales),
        })
    
    # Top 5 products by sales
    top_products_query = db.query(
        Product.name,
        func.sum(SaleItem.quantity).label("total_qty")
    ).join(SaleItem).join(Sale)
    if sale_filters:
        top_products_query = top_products_query.filter(*sale_filters)
    top_products = top_products_query.group_by(Product.id).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(5).all()
    
    return {
        "sales_trend": sales_data,
        "top_products": [{"name": p[0], "quantity": float(p[1])} for p in top_products],
    }
