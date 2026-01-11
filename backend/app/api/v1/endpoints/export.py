"""
Export API Endpoints
====================
Hisobotlarni Excel va CSV formatida eksport qilish.
"""
from typing import Any, Optional
from datetime import datetime, date, timedelta
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.api import deps
from app.models import User
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.product_v2 import ProductV2, ProductVariant
from app.models.customer_v2 import CustomerV2

router = APIRouter()


def create_excel_file(headers: list, rows: list, sheet_name: str = "Sheet1") -> BytesIO:
    """
    Simple Excel file yaratish (CSV-like format with .xls extension)
    openpyxl kutubxonasiz ishlaydi
    """
    import csv
    
    output = BytesIO()
    
    # UTF-8 BOM for Excel
    output.write(b'\xef\xbb\xbf')
    
    # Write CSV content
    content = []
    content.append('\t'.join(str(h) for h in headers))
    
    for row in rows:
        content.append('\t'.join(str(cell) if cell is not None else '' for cell in row))
    
    output.write('\n'.join(content).encode('utf-8'))
    output.seek(0)
    
    return output


@router.get("/sales")
def export_sales(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: Optional[str] = Query(None, description="Boshlanish sanasi (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Tugash sanasi (YYYY-MM-DD)"),
) -> StreamingResponse:
    """Savdolar hisobotini Excel ga eksport qilish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Default dates
    if not end_date:
        end_dt = datetime.utcnow()
    else:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    
    if not start_date:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    
    # Fetch sales
    sales = db.query(SaleV2).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= start_dt,
            SaleV2.created_at <= end_dt,
            SaleV2.status == "completed"
        )
    ).order_by(SaleV2.created_at.desc()).all()
    
    # Headers
    headers = [
        "Chek №",
        "Sana",
        "Vaqt",
        "Mijoz",
        "Mahsulotlar soni",
        "Jami summa",
        "Chegirma",
        "Yakuniy summa",
        "To'lov usuli",
        "Kassir"
    ]
    
    # Rows
    rows = []
    for sale in sales:
        customer = db.query(CustomerV2).filter(CustomerV2.id == sale.customer_id).first() if sale.customer_id else None
        cashier = db.query(User).filter(User.id == sale.cashier_id).first() if sale.cashier_id else None
        
        items_count = db.query(func.count(SaleItemV2.id)).filter(
            SaleItemV2.sale_id == sale.id
        ).scalar() or 0
        
        rows.append([
            sale.receipt_number or f"R-{sale.id}",
            sale.created_at.strftime("%Y-%m-%d"),
            sale.created_at.strftime("%H:%M"),
            customer.name if customer else "-",
            items_count,
            sale.subtotal or 0,
            sale.discount_amount or 0,
            sale.total_amount or 0,
            sale.payment_method or "-",
            cashier.full_name or cashier.username if cashier else "-"
        ])
    
    # Create Excel
    excel_file = create_excel_file(headers, rows, "Savdolar")
    
    filename = f"savdolar_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.xls"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/products")
def export_products(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> StreamingResponse:
    """Mahsulotlar ro'yxatini Excel ga eksport qilish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Fetch products
    products = db.query(ProductV2).filter(
        and_(
            ProductV2.tenant_id == tenant_id,
            ProductV2.is_active == True
        )
    ).all()
    
    # Headers
    headers = [
        "№",
        "Mahsulot nomi",
        "Kategoriya",
        "Turi",
        "Asosiy narx",
        "Tannarx",
        "Variantlar soni"
    ]
    
    # Rows
    rows = []
    for i, product in enumerate(products, 1):
        variants_count = db.query(func.count(ProductVariant.id)).filter(
            ProductVariant.product_id == product.id
        ).scalar() or 0
        
        rows.append([
            i,
            product.name,
            product.category.name if product.category else "-",
            product.type.value if product.type else "-",
            product.base_price or 0,
            product.cost_price or 0,
            variants_count
        ])
    
    # Create Excel
    excel_file = create_excel_file(headers, rows, "Mahsulotlar")
    
    filename = f"mahsulotlar_{datetime.now().strftime('%Y%m%d')}.xls"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/inventory")
def export_inventory(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> StreamingResponse:
    """Ombor hisobotini Excel ga eksport qilish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Fetch variants with product info
    variants = db.query(ProductVariant).filter(
        and_(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.is_active == True
        )
    ).all()
    
    # Headers
    headers = [
        "№",
        "Mahsulot",
        "SKU",
        "Joriy qoldiq",
        "Min. qoldiq",
        "Narx",
        "Tannarx",
        "Jami qiymat",
        "Holat"
    ]
    
    # Rows
    rows = []
    for i, variant in enumerate(variants, 1):
        product = db.query(ProductV2).filter(ProductV2.id == variant.product_id).first()
        
        stock_value = (variant.stock_quantity or 0) * (variant.cost_price or 0)
        
        # Status
        if (variant.stock_quantity or 0) <= 0:
            status = "Tugagan"
        elif (variant.stock_quantity or 0) <= (variant.min_stock_level or 0):
            status = "Kam qolgan"
        else:
            status = "Yetarli"
        
        rows.append([
            i,
            product.name if product else "-",
            variant.sku,
            variant.stock_quantity or 0,
            variant.min_stock_level or 0,
            variant.price or 0,
            variant.cost_price or 0,
            stock_value,
            status
        ])
    
    # Create Excel
    excel_file = create_excel_file(headers, rows, "Ombor")
    
    filename = f"ombor_{datetime.now().strftime('%Y%m%d')}.xls"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/customers")
def export_customers(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> StreamingResponse:
    """Mijozlar ro'yxatini Excel ga eksport qilish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Fetch customers
    customers = db.query(CustomerV2).filter(
        and_(
            CustomerV2.tenant_id == tenant_id,
            CustomerV2.is_active == True
        )
    ).all()
    
    # Headers
    headers = [
        "№",
        "Ism",
        "Telefon",
        "Manzil",
        "Jami xaridlar",
        "Joriy qarz",
        "Darajasi",
        "Ro'yxatdan o'tgan"
    ]
    
    # Rows
    rows = []
    for i, customer in enumerate(customers, 1):
        rows.append([
            i,
            customer.name,
            customer.phone or "-",
            customer.address or "-",
            customer.total_purchases or 0,
            customer.current_debt or 0,
            customer.tier or "regular",
            customer.created_at.strftime("%Y-%m-%d") if customer.created_at else "-"
        ])
    
    # Create Excel
    excel_file = create_excel_file(headers, rows, "Mijozlar")
    
    filename = f"mijozlar_{datetime.now().strftime('%Y%m%d')}.xls"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/daily-summary")
def export_daily_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
) -> StreamingResponse:
    """Kunlik hisobot - har bir kun uchun savdo statistikasi"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Default dates
    if not end_date:
        end_dt = datetime.utcnow()
    else:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    if not start_date:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    
    # Headers
    headers = [
        "Sana",
        "Savdolar soni",
        "Jami summa",
        "Naqd",
        "Karta",
        "O'tkazma",
        "Nasiya",
        "Chegirmalar",
        "O'rtacha chek"
    ]
    
    rows = []
    current_date = start_dt
    
    while current_date <= end_dt:
        next_date = current_date + timedelta(days=1)
        
        # Daily sales
        daily_sales = db.query(SaleV2).filter(
            and_(
                SaleV2.tenant_id == tenant_id,
                SaleV2.created_at >= current_date,
                SaleV2.created_at < next_date,
                SaleV2.status == "completed"
            )
        ).all()
        
        if daily_sales:
            total = sum(s.total_amount or 0 for s in daily_sales)
            cash = sum(s.total_amount or 0 for s in daily_sales if s.payment_method == "cash")
            card = sum(s.total_amount or 0 for s in daily_sales if s.payment_method == "card")
            transfer = sum(s.total_amount or 0 for s in daily_sales if s.payment_method == "transfer")
            debt = sum(s.total_amount or 0 for s in daily_sales if s.payment_method == "debt")
            discounts = sum(s.discount_amount or 0 for s in daily_sales)
            avg = total / len(daily_sales) if daily_sales else 0
            
            rows.append([
                current_date.strftime("%Y-%m-%d"),
                len(daily_sales),
                total,
                cash,
                card,
                transfer,
                debt,
                discounts,
                round(avg, 2)
            ])
        else:
            rows.append([
                current_date.strftime("%Y-%m-%d"),
                0, 0, 0, 0, 0, 0, 0, 0
            ])
        
        current_date = next_date
    
    # Create Excel
    excel_file = create_excel_file(headers, rows, "Kunlik hisobot")
    
    filename = f"kunlik_hisobot_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.xls"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
