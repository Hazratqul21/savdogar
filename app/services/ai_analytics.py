"""
AI Analytics Service - Automatic Business Insights
Analyzes sales data and provides AI-generated recommendations
"""

from typing import Dict, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sale, SaleItem, Product, ScannedReceipt
from app.services.openai_service import openai_service


def get_sales_summary(db: Session, tenant_id: int, days: int = 30) -> Dict:
    """Get sales summary for AI analysis using V2 models."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total sales (SaleV2)
    total_sales = db.query(func.sum(SaleV2.total_amount)).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= start_date,
            SaleV2.status == "completed"
        )
    ).scalar() or 0
    
    # Number of transactions
    transaction_count = db.query(func.count(SaleV2.id)).filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= start_date,
            SaleV2.status == "completed"
        )
    ).scalar() or 0
    
    # Top products (V2)
    from app.models.product_v2 import ProductV2, ProductVariant
    top_products = db.query(
        ProductV2.name,
        func.sum(SaleItemV2.quantity).label('total_qty'),
        func.sum(SaleItemV2.total).label('total_revenue')
    ).join(ProductVariant, ProductV2.id == ProductVariant.product_id)\
     .join(SaleItemV2, ProductVariant.id == SaleItemV2.variant_id)\
     .join(SaleV2, SaleItemV2.sale_id == SaleV2.id)\
     .filter(
        and_(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= start_date,
            SaleV2.status == "completed"
        )
    ).group_by(ProductV2.id).order_by(
        func.sum(SaleItemV2.total).desc()
    ).limit(10).all()
    
    # Note: ScannedReceipt might need tenant_id check too if it's multi-tenant
    scanned_count = db.query(func.count(ScannedReceipt.id)).filter(
        ScannedReceipt.created_at >= start_date,
        ScannedReceipt.status == "confirmed"
    ).scalar() or 0
    
    return {
        "period_days": days,
        "total_sales": float(total_sales),
        "transaction_count": transaction_count,
        "average_transaction": float(total_sales / transaction_count) if transaction_count > 0 else 0,
        "scanned_receipts": scanned_count,
        "top_products": [
            {
                "name": p[0],
                "quantity": float(p[1]),
                "revenue": float(p[2])
            } for p in top_products
        ]
    }

from sqlalchemy import and_

def generate_ai_insights(db: Session, tenant_id: int, days: int = 30) -> Dict:
    """
    Generate AI-powered business insights for specific tenant.
    """
    # Get sales data
    summary = get_sales_summary(db, tenant_id, days)
    
    # Create prompt for AI analysis
    prompt = f"""Siz biznes tahlilchisisiz. Quyidagi savdo ma'lumotlarini tahlil qiling va o'zbek tilida qisqa xulosalar va tavsiyalar bering.

MA'LUMOTLAR ({days} kun):
- Umumiy savdo: {summary['total_sales']:,.0f} so'm
- Tranzaksiyalar soni: {summary['transaction_count']}
- O'rtacha chek: {summary['average_transaction']:,.0f} so'm
- Skanerlangan cheklar: {summary['scanned_receipts']}

ENG KO'P SOTILADIGAN MAHSULOTLAR:
{chr(10).join([f"- {p['name']}: {p['quantity']:.0f} dona, {p['revenue']:,.0f} so'm" for p in summary['top_products'][:5]])}

VAZIFA:
1. Qisqa xulosa (2-3 jumla)
2. 3 ta asosiy tavsiya
3. Kelajak prognozi (1-2 jumla)

JSON formatida javob bering:
{{
  "summary": "Qisqa xulosa...",
  "recommendations": [
    "Tavsiya 1",
    "Tavsiya 2", 
    "Tavsiya 3"
  ],
  "forecast": "Kelajak prognozi..."
}}

Faqat JSON qaytaring, boshqa matn yo'q."""

    try:
        # Call OpenAI for analysis
        response = openai_service.client.chat.completions.create(
            model=openai_service.model,
            messages=[
                {"role": "system", "content": "Siz professional biznes tahlilchisisiz. Qisqa va aniq javoblar bering."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        insights = json.loads(content)
        
        # Add metadata
        insights["generated_at"] = datetime.utcnow().isoformat()
        insights["period_days"] = days
        insights["data_summary"] = {
            "total_sales": summary['total_sales'],
            "transactions": summary['transaction_count'],
            "avg_transaction": summary['average_transaction']
        }
        
        return insights
        
    except Exception as e:
        # Fallback insights if AI fails
        return {
            "summary": f"So'nggi {days} kunda {summary['transaction_count']} ta tranzaksiya amalga oshirildi va {summary['total_sales']:,.0f} so'm daromad olindi.",
            "recommendations": [
                "Eng ko'p sotiladigan mahsulotlar omborda yetarli miqdorda bo'lishini ta'minlang",
                "Kam sotiladigan mahsulotlar uchun marketing kampaniyalari o'tkazing",
                "Mijozlar bilan aloqani yaxshilang va sodiqlik dasturlarini joriy qiling"
            ],
            "forecast": "Joriy tendensiyani saqlab qolish uchun mahsulot assortimentini kengaytiring.",
            "generated_at": datetime.utcnow().isoformat(),
            "period_days": days,
            "error": str(e)
        }


def get_product_recommendations(db: Session, tenant_id: int) -> List[str]:
    """Get AI-powered product recommendations for specific tenant."""
    summary = get_sales_summary(db, tenant_id, 30)
    
    prompt = f"""Quyidagi savdo ma'lumotlariga asoslanib, qaysi mahsulotlarni omborda ko'proq saqlash kerakligini tavsiya qiling.

TOP MAHSULOTLAR:
{chr(10).join([f"- {p['name']}: {p['quantity']:.0f} dona sotildi" for p in summary['top_products'][:5]])}

3 ta qisqa tavsiya bering (har biri 1 jumla). Faqat ro'yxat qaytaring, boshqa matn yo'q."""

    try:
        response = openai_service.client.chat.completions.create(
            model=openai_service.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        recommendations = [line.strip('- ').strip() for line in content.split('\n') if line.strip()]
        return recommendations[:3]
        
    except:
        return [
            "Eng ko'p sotiladigan mahsulotlar zaxirasini oshiring",
            "Mavsumiy mahsulotlar uchun tayyorgarlik ko'ring",
            "Yangi mahsulotlarni sinab ko'ring"
        ]
