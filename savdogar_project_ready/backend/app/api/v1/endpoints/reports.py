from typing import Any
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models import Sale, SaleItem, Product, User
from app.services.export_service import (
    export_sales_to_pdf,
    export_sales_to_excel,
    export_products_to_excel
)
from app.services.qr_service import (
    generate_product_qr,
    generate_receipt_qr,
    generate_sale_qr
)
from app.services.print_service import generate_receipt_pdf

router = APIRouter()

@router.get("/sales")
def get_sales_report(
    db: Session = Depends(deps.get_db),
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get sales report for date range."""
    query = db.query(Sale)
    
    if start_date:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end_date))
    
    sales = query.all()
    
    total_sales = sum(s.total_amount for s in sales)
    total_transactions = len(sales)
    
    return {
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_sale": total_sales / total_transactions if total_transactions > 0 else 0,
        "sales": [
            {
                "id": s.id,
                "total_amount": s.total_amount,
                "payment_method": s.payment_method.value,
                "created_at": s.created_at.isoformat(),
            }
            for s in sales
        ],
    }

@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get inventory report."""
    products = db.query(Product).all()
    
    total_value = sum(p.stock_quantity * p.cost_price for p in products)
    low_stock = [p for p in products if p.stock_quantity < 10]
    
    return {
        "total_products": len(products),
        "total_inventory_value": total_value,
        "low_stock_count": len(low_stock),
        "low_stock_items": [
            {"id": p.id, "name": p.name, "stock": p.stock_quantity}
            for p in low_stock
        ],
    }

@router.get("/profit")
def get_profit_report(
    db: Session = Depends(deps.get_db),
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get profit report."""
    query = db.query(SaleItem).join(Sale)
    
    if start_date:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end_date))
    
    items = query.all()
    
    total_revenue = 0
    total_cost = 0
    
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            total_revenue += item.price * item.quantity
            total_cost += product.cost_price * item.quantity
    
    return {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "gross_profit": total_revenue - total_cost,
        "profit_margin": ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0,
    }

@router.get("/sales/export/pdf")
def export_sales_pdf(
    db: Session = Depends(deps.get_db),
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Export sales report to PDF."""
    query = db.query(Sale)
    if start_date:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end_date))
    
    sales = query.all()
    sales_data = [
        {
            'id': s.id,
            'created_at': s.created_at.isoformat(),
            'customer_name': getattr(s.customer, 'name', 'N/A') if hasattr(s, 'customer') and s.customer else 'N/A',
            'total_amount': float(s.total_amount),
            'item_count': len(s.items) if hasattr(s, 'items') else 0
        }
        for s in sales
    ]
    
    pdf_bytes = export_sales_to_pdf(sales_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sales_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

@router.get("/sales/export/excel")
def export_sales_excel(
    db: Session = Depends(deps.get_db),
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Export sales report to Excel."""
    query = db.query(Sale)
    if start_date:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end_date))
    
    sales = query.all()
    sales_data = [
        {
            'id': s.id,
            'created_at': s.created_at.isoformat(),
            'customer_name': getattr(s.customer, 'name', 'N/A') if hasattr(s, 'customer') and s.customer else 'N/A',
            'total_amount': float(s.total_amount),
            'item_count': len(s.items) if hasattr(s, 'items') else 0
        }
        for s in sales
    ]
    
    excel_bytes = export_sales_to_excel(sales_data)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=sales_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@router.get("/products/export/excel")
def export_products_excel(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Export products to Excel."""
    products = db.query(Product).all()
    products_data = [
        {
            'id': p.id,
            'name': p.name,
            'price': float(p.price),
            'cost_price': float(p.cost_price or 0),
            'stock_quantity': float(p.stock_quantity),
            'barcode': p.barcode or '',
            'category_name': p.category.name if p.category else ''
        }
        for p in products
    ]
    
    excel_bytes = export_products_to_excel(products_data)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=products_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@router.get("/qr/product/{product_id}")
def get_product_qr(
    product_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate QR code for product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    
    qr_code = generate_product_qr(product.id, product.name, product.barcode)
    return {"qr_code": qr_code}

@router.get("/qr/sale/{sale_id}")
def get_sale_qr(
    sale_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate QR code for sale."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sale not found")
    
    qr_code = generate_sale_qr(sale.id)
    return {"qr_code": qr_code}

@router.get("/print/receipt/{sale_id}")
def print_receipt(
    sale_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate printable receipt PDF."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sale not found")
    
    items = []
    if hasattr(sale, 'items'):
        for item in sale.items:
            items.append({
                'product_name': item.product.name if item.product else 'N/A',
                'quantity': float(item.quantity),
                'unit_price': float(item.price),
                'total': float(item.total)
            })
    
    sale_data = {
        'id': sale.id,
        'created_at': sale.created_at.isoformat(),
        'total_amount': float(sale.total_amount)
    }
    
    pdf_bytes = generate_receipt_pdf(sale_data, items)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=receipt_{sale_id}.pdf"}
    )
