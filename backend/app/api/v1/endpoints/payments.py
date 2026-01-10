"""
Payment gateway integrations for Click and Payme.
These are stub implementations - replace with actual API calls in production.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import hashlib
import os

from app.api import deps
from app.models import Sale, User

router = APIRouter()

# Click Configuration
CLICK_MERCHANT_ID = os.getenv("CLICK_MERCHANT_ID", "")
CLICK_SERVICE_ID = os.getenv("CLICK_SERVICE_ID", "")
CLICK_SECRET_KEY = os.getenv("CLICK_SECRET_KEY", "")

# Payme Configuration
PAYME_MERCHANT_ID = os.getenv("PAYME_MERCHANT_ID", "")
PAYME_SECRET_KEY = os.getenv("PAYME_SECRET_KEY", "")


class PaymentRequest(BaseModel):
    sale_id: int
    amount: float
    provider: str  # "click" or "payme"
    return_url: str = ""


class PaymentCallback(BaseModel):
    transaction_id: str
    status: str
    amount: float
    sale_id: int


@router.post("/create")
def create_payment(
    *,
    db: Session = Depends(deps.get_db),
    payment: PaymentRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create payment request for Click or Payme."""
    sale = db.query(Sale).filter(Sale.id == payment.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    if payment.provider == "click":
        return create_click_payment(sale, payment)
    elif payment.provider == "payme":
        return create_payme_payment(sale, payment)
    else:
        raise HTTPException(status_code=400, detail="Invalid payment provider")


def create_click_payment(sale: Sale, payment: PaymentRequest) -> Dict:
    """Generate Click payment URL."""
    # In production, this would create a real payment request
    timestamp = int(datetime.utcnow().timestamp())
    sign_string = f"{CLICK_MERCHANT_ID}{sale.id}{sale.total_amount}{CLICK_SECRET_KEY}"
    sign = hashlib.md5(sign_string.encode()).hexdigest()
    
    return {
        "provider": "click",
        "payment_url": f"https://my.click.uz/services/pay?merchant_id={CLICK_MERCHANT_ID}&service_id={CLICK_SERVICE_ID}&transaction_param={sale.id}&amount={sale.total_amount}&return_url={payment.return_url}",
        "transaction_id": f"click_{sale.id}_{timestamp}",
        "status": "pending",
        "message": "Redirect user to payment_url"
    }


def create_payme_payment(sale: Sale, payment: PaymentRequest) -> Dict:
    """Generate Payme payment URL."""
    import base64
    
    # In production, this would create a real payment request
    amount_tiyin = int(sale.total_amount * 100)  # Payme uses tiyin
    
    params = f"m={PAYME_MERCHANT_ID};ac.order_id={sale.id};a={amount_tiyin}"
    encoded = base64.b64encode(params.encode()).decode()
    
    return {
        "provider": "payme",
        "payment_url": f"https://checkout.paycom.uz/{encoded}",
        "transaction_id": f"payme_{sale.id}_{int(datetime.utcnow().timestamp())}",
        "status": "pending",
        "message": "Redirect user to payment_url"
    }


@router.post("/callback/click")
def click_callback(
    callback: PaymentCallback,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Handle Click payment callback."""
    # Verify signature and update sale status
    sale = db.query(Sale).filter(Sale.id == callback.sale_id).first()
    if not sale:
        return {"error": -5, "error_note": "Sale not found"}
    
    if callback.status == "confirmed":
        sale.payment_status = "paid"
        db.commit()
        return {"error": 0, "error_note": "Success"}
    
    return {"error": -1, "error_note": "Payment failed"}


@router.post("/callback/payme")
def payme_callback(
    callback: PaymentCallback,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Handle Payme payment callback."""
    sale = db.query(Sale).filter(Sale.id == callback.sale_id).first()
    if not sale:
        return {"error": {"code": -31050, "message": "Sale not found"}}
    
    if callback.status == "confirmed":
        sale.payment_status = "paid"
        db.commit()
        return {"result": {"state": 2}}
    
    return {"error": {"code": -31008, "message": "Payment failed"}}


@router.get("/status/{sale_id}")
def get_payment_status(
    *,
    db: Session = Depends(deps.get_db),
    sale_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get payment status for a sale."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return {
        "sale_id": sale.id,
        "amount": float(sale.total_amount),
        "payment_status": getattr(sale, 'payment_status', 'pending'),
        "payment_method": sale.payment_method.value,
    }
