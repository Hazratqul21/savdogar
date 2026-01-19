from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.product_v2 import ProductV2, ProductVariant
from app.services.export_service import (
    export_sales_to_pdf,
    export_sales_to_excel,
    export_products_to_excel
)

router = APIRouter()

@router.get("/sales")
def get_sales_report(
    db: Session = Depends(deps.get_db),
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get sales report for date range using V2 models."""
    if current_user.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan."
        )
    
    tenant_id = current_user.tenant_id
    query = db.query(SaleV2).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.status == "completed"
        )
    )
    
    if start_date:
        query = query.filter(SaleV2.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(SaleV2.created_at < end_dt)
    
    sales = query.order_by(SaleV2.created_at.desc()).all()
    
    total_sales = sum(s.total_amount for s in sales)
    total_transactions = len(sales)
    
    return {
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_sale": total_sales / total_transactions if total_transactions > 0 else 0,
        "sales": [
            {
                "id": s.id,
                "receipt_number": s.receipt_number,
                "total_amount": s.total_amount,
                "payment_method": s.payment_method,
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
    """Get inventory report using V2 models."""
    if current_user.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan."
        )
        
    tenant_id = current_user.tenant_id
    variants = db.query(ProductVariant).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.is_active == True
        )
    ).all()
    
    total_products = db.query(func.count(ProductV2.id)).filter(
        ProductV2.tenant_id == tenant_id,
        ProductV2.is_active == True
    ).scalar() or 0
    
    total_value = sum((v.stock_quantity or 0) * (v.cost_price or 0) for v in variants)
    low_stock_items = [v for v in variants if (v.stock_quantity or 0) < (v.min_stock_level or 10)]
    
    return {
        "total_products": total_products,
        "total_variants": len(variants),
        "total_inventory_value": total_value,
        "low_stock_count": len(low_stock_items),
        "low_stock": [
            {
                "id": v.id, 
                "name": v.product_v2.name if v.product_v2 else f"SKU: {v.sku}", 
                "stock_quantity": v.stock_quantity,
                "min_stock": v.min_stock_level
            }
            for v in low_stock_items
        ],
    }

@router.get("/profit")
def get_profit_report(
    db: Session = Depends(deps.get_db),
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get profit report using V2 models."""
    if current_user.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan."
        )
        
    tenant_id = current_user.tenant_id
    query = db.query(SaleItemV2).join(SaleV2).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.status == "completed"
        )
    )
    
    if start_date:
        query = query.filter(SaleV2.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(SaleV2.created_at < end_dt)
    
    items = query.all()
    
    total_revenue = 0
    total_cost = 0
    
    for item in items:
        variant = item.variant
        if variant:
            total_revenue += item.total
            total_cost += (variant.cost_price or 0) * item.quantity
    
    return {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "gross_profit": total_revenue - total_cost,
        "profit_margin": ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0,
    }

@router.get("/top-products")
def get_top_products(
    db: Session = Depends(deps.get_db),
    limit: int = 10,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get top selling products."""
    tenant_id = current_user.tenant_id
    top_products = db.query(
        ProductV2.name,
        ProductV2.id,
        func.sum(SaleItemV2.quantity).label("sold_count")
    ).join(ProductVariant, ProductV2.id == ProductVariant.product_id)\
     .join(SaleItemV2, ProductVariant.id == SaleItemV2.variant_id)\
     .join(SaleV2, SaleItemV2.sale_id == SaleV2.id)\
     .filter(SaleV2.tenant_id == tenant_id, SaleV2.status == "completed")\
     .group_by(ProductV2.id)\
     .order_by(func.sum(SaleItemV2.quantity).desc())\
     .limit(limit).all()
     
    return [
        {"id": p[1], "name": p[0], "sold_count": float(p[2])}
        for p in top_products
    ]

@router.get("/sales/export/pdf")
def export_sales_pdf(
    db: Session = Depends(deps.get_db),
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Export sales report to PDF."""
    tenant_id = current_user.tenant_id
    query = db.query(SaleV2).filter(SaleV2.tenant_id == tenant_id, SaleV2.status == "completed")
    
    if start_date:
        query = query.filter(SaleV2.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(SaleV2.created_at < end_dt)
    
    sales = query.all()
    sales_data = [
        {
            'id': s.id,
            'created_at': s.created_at.isoformat(),
            'customer_name': s.customer.name if s.customer else 'N/A',
            'total_amount': float(s.total_amount),
            'item_count': len(s.items)
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
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Export sales report to Excel."""
    tenant_id = current_user.tenant_id
    query = db.query(SaleV2).filter(SaleV2.tenant_id == tenant_id, SaleV2.status == "completed")
    
    if start_date:
        query = query.filter(SaleV2.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(SaleV2.created_at < end_dt)
    
    sales = query.all()
    sales_data = [
        {
            'id': s.id,
            'created_at': s.created_at.isoformat(),
            'customer_name': s.customer.name if s.customer else 'N/A',
            'total_amount': float(s.total_amount),
            'item_count': len(s.items)
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
    tenant_id = current_user.tenant_id
    variants = db.query(ProductVariant).filter(ProductVariant.tenant_id == tenant_id).all()
    products_data = [
        {
            'id': v.id,
            'name': v.product_v2.name if v.product_v2 else f"SKU: {v.sku}",
            'price': float(v.price),
            'cost_price': float(v.cost_price or 0),
            'stock_quantity': float(v.stock_quantity or 0),
            'barcode': v.sku, # Or more accurately, use barcode aliases if they exist
            'category_name': v.product_v2.category.name if v.product_v2 and v.product_v2.category else ''
        }
        for v in variants
    ]
    
    excel_bytes = export_products_to_excel(products_data)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=products_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@router.get("/qr/product/{variant_id}")
def get_product_qr(
    variant_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate QR code for product variant."""
    tenant_id = current_user.tenant_id
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id, ProductVariant.tenant_id == tenant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    
    from app.services.qr_service import generate_product_qr
    qr_code = generate_product_qr(variant.id, variant.product_v2.name if variant.product_v2 else variant.sku, variant.sku)
    return {"qr_code": qr_code}
