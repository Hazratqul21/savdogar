from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.models import Sale, SaleItem, Product, User
from app.services.qr_service import generate_qr_code, generate_receipt_id, verify_receipt_id

router = APIRouter()

@router.get("/{sale_id}/qr")
def get_sale_qr(
    *,
    db: Session = Depends(deps.get_db),
    sale_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get QR code for a sale."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    qr_base64 = generate_sale_qr(sale_id)
    receipt_id = generate_receipt_id(sale_id)
    
    return {
        "sale_id": sale_id,
        "receipt_id": receipt_id,
        "qr_code": qr_base64,  # Already includes data:image/png;base64 prefix
    }

# Public verification endpoint (no auth required)
public_router = APIRouter()

@public_router.get("/{receipt_id}", response_class=HTMLResponse)
def verify_receipt(
    *,
    db: Session = Depends(deps.get_db),
    receipt_id: str,
) -> HTMLResponse:
    """Public page to verify receipt."""
    # Find sale by receipt_id
    sales = db.query(Sale).all()
    sale = None
    for s in sales:
        if verify_receipt_id(receipt_id, s.id):
            sale = s
            break
    
    if not sale:
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chek topilmadi</title>
            <style>
                body { font-family: 'Inter', sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                .error { color: #ef4444; font-size: 3rem; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="error">❌</div>
                <h1>Chek topilmadi</h1>
                <p>Bu QR kod yaroqsiz yoki chek mavjud emas.</p>
            </div>
        </body>
        </html>
        """, status_code=404)
    
    # Get sale items
    items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
    items_html = ""
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        name = product.name if product else "Noma'lum"
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">{item.price:,.0f}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">{item.total:,.0f}</td>
        </tr>
        """
    
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chek #{sale.id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; padding: 1rem; display: flex; justify-content: center; align-items: center; }}
            .card {{ background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; width: 100%; }}
            .header {{ text-align: center; margin-bottom: 1.5rem; }}
            .verified {{ color: #10b981; font-size: 3rem; }}
            h1 {{ margin: 0.5rem 0; color: #1f2937; }}
            .meta {{ color: #6b7280; font-size: 0.9rem; }}
            table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; }}
            th {{ background: #f9fafb; padding: 8px; text-align: left; font-weight: 600; }}
            .total {{ font-size: 1.5rem; font-weight: bold; color: #4f46e5; text-align: right; margin-top: 1rem; }}
            .badge {{ background: #4f46e5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <div class="verified">✓</div>
                <h1>SmartPOS</h1>
                <p class="meta">Chek #{sale.id}</p>
                <p class="meta">{sale.created_at.strftime('%d.%m.%Y %H:%M')}</p>
                <span class="badge">{sale.payment_method.value.upper()}</span>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Mahsulot</th>
                        <th style="text-align: center;">Soni</th>
                        <th style="text-align: right;">Narx</th>
                        <th style="text-align: right;">Jami</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <div class="total">
                Jami: {sale.total_amount:,.0f} so'm
            </div>
        </div>
    </body>
    </html>
    """)
