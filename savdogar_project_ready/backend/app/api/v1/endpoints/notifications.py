from typing import Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.models import Sale, SaleItem, Product, User
from app.services.telegram import telegram_service

router = APIRouter()

class NotificationTest(BaseModel):
    message: str

@router.get("/status")
def get_telegram_status(
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Check Telegram bot status."""
    return {
        "enabled": telegram_service.enabled,
        "token_configured": bool(telegram_service.token),
        "chat_id_configured": bool(telegram_service.chat_id),
    }

@router.post("/test")
async def test_notification(
    notification: NotificationTest,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Send test notification."""
    success = await telegram_service.send_message(notification.message)
    return {"success": success}

@router.post("/daily-report")
def send_daily_report(
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Manually trigger daily report."""
    today = datetime.utcnow().date()
    
    # Get today's stats
    today_sales = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.created_at) == today
    ).scalar() or 0
    
    today_transactions = db.query(func.count(Sale.id)).filter(
        func.date(Sale.created_at) == today
    ).scalar() or 0
    
    low_stock_count = db.query(func.count(Product.id)).filter(
        Product.stock_quantity < 10
    ).scalar() or 0
    
    # Top product
    top_product_result = db.query(
        Product.name,
        func.sum(SaleItem.quantity)
    ).join(SaleItem).join(Sale).filter(
        func.date(Sale.created_at) == today
    ).group_by(Product.id).order_by(func.sum(SaleItem.quantity).desc()).first()
    
    top_product = top_product_result[0] if top_product_result else "N/A"
    
    # Send in background
    background_tasks.add_task(
        telegram_service.send_daily_report,
        float(today_sales),
        today_transactions,
        low_stock_count,
        top_product
    )
    
    return {"message": "Daily report queued"}

@router.post("/low-stock-alerts")
def send_low_stock_alerts(
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    threshold: float = 10,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Send alerts for low stock products."""
    low_stock_products = db.query(Product).filter(
        Product.stock_quantity < threshold
    ).all()
    
    for product in low_stock_products:
        background_tasks.add_task(
            telegram_service.notify_low_stock,
            product.name,
            product.stock_quantity,
            product.unit
        )
    
    return {"message": f"Queued {len(low_stock_products)} alerts"}
