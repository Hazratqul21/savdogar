"""
AI Product Recommendations Service
Provides intelligent product recommendations during sales
"""

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models import Product, Sale, SaleItem, Category
from app.services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)


def get_product_recommendations_for_sale(
    db: Session,
    cart_items: List[Dict],
    customer_id: Optional[int] = None
) -> List[Dict]:
    """
    Get AI-powered product recommendations based on current cart items.
    
    Args:
        db: Database session
        cart_items: List of items in cart with product_id, quantity, etc.
        customer_id: Optional customer ID for personalized recommendations
    
    Returns:
        List of recommended products with reasons
    """
    try:
        # Get cart product IDs
        cart_product_ids = [item.get('product_id') for item in cart_items if item.get('product_id')]
        
        if not cart_product_ids:
            # If cart is empty, recommend top-selling products
            return get_top_selling_recommendations(db, limit=5)
        
        # Get cart products info
        cart_products = db.query(Product).filter(Product.id.in_(cart_product_ids)).all()
        cart_product_names = [p.name for p in cart_products]
        
        # Get frequently bought together products
        frequently_bought = get_frequently_bought_together(db, cart_product_ids, limit=10)
        
        # Get customer purchase history if available
        customer_history = []
        if customer_id:
            customer_history = get_customer_purchase_history(db, customer_id, limit=20)
        
        # Prepare data for AI
        prompt = f"""Siz professional do'kon yordamchisisiz. Mijoz savatiga quyidagi mahsulotlar qo'shilgan:

SAVATDA:
{chr(10).join([f"- {name}" for name in cart_product_names])}

KO'P SOTILADIGAN MAHSULOTLAR (bilan birga):
{chr(10).join([f"- {p['name']}: {p['count']} marta birga sotilgan" for p in frequently_bought[:5]])}

VAZIFA:
1. Savatdagi mahsulotlarga asoslanib, 3-5 ta qo'shimcha mahsulot tavsiya qiling
2. Har bir tavsiya uchun qisqa sabab bering (1 jumla)
3. Faqat mavjud mahsulotlarni tavsiya qiling

JSON formatida javob bering:
{{
  "recommendations": [
    {{
      "product_name": "Mahsulot nomi",
      "reason": "Nima uchun tavsiya qilinayotgani"
    }}
  ]
}}

Faqat JSON qaytaring, boshqa matn yo'q."""

        # Call AI
        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "Siz professional do'kon yordamchisisiz. Mijozlarga foydali mahsulot tavsiyalari bering."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        ai_result = json.loads(content)
        
        # Match recommendations with actual products
        recommendations = []
        for rec in ai_result.get('recommendations', [])[:5]:
            product_name = rec.get('product_name', '').strip()
            reason = rec.get('reason', '')
            
            # Find product by name (fuzzy match)
            product = db.query(Product).filter(
                Product.name.ilike(f"%{product_name}%")
            ).first()
            
            if product and product.id not in cart_product_ids:
                recommendations.append({
                    'product_id': product.id,
                    'name': product.name,
                    'price': float(product.price),
                    'stock_quantity': float(product.stock_quantity),
                    'reason': reason,
                    'image_url': getattr(product, 'image_url', None)
                })
        
        # If AI didn't return enough, add frequently bought together
        if len(recommendations) < 3:
            for fb in frequently_bought:
                if fb['product_id'] not in cart_product_ids and len(recommendations) < 5:
                    product = db.query(Product).filter(Product.id == fb['product_id']).first()
                    if product:
                        recommendations.append({
                            'product_id': product.id,
                            'name': product.name,
                            'price': float(product.price),
                            'stock_quantity': float(product.stock_quantity),
                            'reason': f"Bu mahsulot ko'pincha savatdagi mahsulotlar bilan birga sotiladi",
                            'image_url': getattr(product, 'image_url', None)
                        })
        
        return recommendations[:5]
        
    except Exception as e:
        logger.error(f"Error generating AI recommendations: {e}")
        # Fallback to frequently bought together
        return get_frequently_bought_together_products(db, cart_product_ids, limit=5)


def get_frequently_bought_together(
    db: Session,
    product_ids: List[int],
    limit: int = 10
) -> List[Dict]:
    """Get products frequently bought together with given products."""
    if not product_ids:
        return []
    
    # Find sales that contain any of the cart products
    sales_with_cart_products = db.query(SaleItem.sale_id).filter(
        SaleItem.product_id.in_(product_ids)
    ).distinct().subquery()
    
    # Get other products from those sales
    frequently_bought = db.query(
        SaleItem.product_id,
        Product.name,
        func.count(SaleItem.sale_id).label('count')
    ).join(Product).filter(
        SaleItem.sale_id.in_(db.query(sales_with_cart_products.c.sale_id)),
        ~SaleItem.product_id.in_(product_ids)  # Exclude cart products
    ).group_by(
        SaleItem.product_id,
        Product.name
    ).order_by(
        func.count(SaleItem.sale_id).desc()
    ).limit(limit).all()
    
    return [
        {
            'product_id': p[0],
            'name': p[1],
            'count': p[2]
        }
        for p in frequently_bought
    ]


def get_frequently_bought_together_products(
    db: Session,
    product_ids: List[int],
    limit: int = 5
) -> List[Dict]:
    """Get product details for frequently bought together."""
    frequently_bought = get_frequently_bought_together(db, product_ids, limit)
    
    recommendations = []
    for fb in frequently_bought:
        product = db.query(Product).filter(Product.id == fb['product_id']).first()
        if product:
            recommendations.append({
                'product_id': product.id,
                'name': product.name,
                'price': float(product.price),
                'stock_quantity': float(product.stock_quantity),
                'reason': f"Bu mahsulot ko'pincha birga sotiladi",
                'image_url': getattr(product, 'image_url', None)
            })
    
    return recommendations


def get_top_selling_recommendations(
    db: Session,
    limit: int = 5
) -> List[Dict]:
    """Get top-selling products as recommendations."""
    start_date = datetime.utcnow() - timedelta(days=30)
    
    top_products = db.query(
        Product.id,
        Product.name,
        Product.price,
        Product.stock_quantity,
        func.sum(SaleItem.quantity).label('total_sold')
    ).join(SaleItem).join(Sale).filter(
        Sale.created_at >= start_date
    ).group_by(
        Product.id, Product.name, Product.price, Product.stock_quantity
    ).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(limit).all()
    
    return [
        {
            'product_id': p[0],
            'name': p[1],
            'price': float(p[2]),
            'stock_quantity': float(p[3]),
            'reason': f"Eng ko'p sotiladigan mahsulotlar",
            'image_url': None
        }
        for p in top_products
    ]


def get_customer_purchase_history(
    db: Session,
    customer_id: int,
    limit: int = 20
) -> List[Dict]:
    """Get customer's purchase history."""
    start_date = datetime.utcnow() - timedelta(days=90)
    
    history = db.query(
        Product.id,
        Product.name,
        func.sum(SaleItem.quantity).label('total_qty')
    ).join(SaleItem).join(Sale).filter(
        Sale.customer_id == customer_id,
        Sale.created_at >= start_date
    ).group_by(
        Product.id, Product.name
    ).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(limit).all()
    
    return [
        {
            'product_id': p[0],
            'name': p[1],
            'total_quantity': float(p[2])
        }
        for p in history
    ]


def get_ai_pricing_suggestions(
    db: Session,
    product_id: int
) -> Dict:
    """
    Get AI-powered pricing suggestions for a product.
    Analyzes market trends, profit margins, and sales data.
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {}
        
        # Get sales data for this product
        start_date = datetime.utcnow() - timedelta(days=90)
        sales_data = db.query(
            func.sum(SaleItem.quantity).label('total_qty'),
            func.sum(SaleItem.total).label('total_revenue'),
            func.avg(SaleItem.unit_price).label('avg_price')
        ).join(Sale).filter(
            SaleItem.product_id == product_id,
            Sale.created_at >= start_date
        ).first()
        
        # Get similar products
        similar_products = db.query(Product).filter(
            Product.category_id == product.category_id,
            Product.id != product_id
        ).limit(5).all()
        
        current_price = float(product.price)
        cost_price = float(product.cost_price or 0)
        profit_margin = ((current_price - cost_price) / current_price * 100) if current_price > 0 else 0
        
        prompt = f"""Siz narx strategiyasi mutaxassisisiz. Quyidagi mahsulot uchun narx tavsiyalari bering.

MAHSULOT:
- Nomi: {product.name}
- Joriy narx: {current_price:,.0f} so'm
- Xarajat narxi: {cost_price:,.0f} so'm
- Foyda foizi: {profit_margin:.1f}%
- Ombordagi miqdor: {product.stock_quantity} {product.unit}

SO'NGGI 90 KUN STATISTIKA:
- Sotilgan miqdor: {sales_data[0] or 0:.0f} dona
- Umumiy daromad: {sales_data[1] or 0:,.0f} so'm
- O'rtacha narx: {sales_data[2] or current_price:,.0f} so'm

VAZIFA:
1. Optimal narxni hisoblang (foyda va raqobatbardoshlikni hisobga olgan holda)
2. Minimal narx (pastki chegara)
3. Maksimal narx (yuqori chegara)
4. Qisqa tavsiya (1 jumla)

JSON formatida javob bering:
{{
  "optimal_price": raqam,
  "min_price": raqam,
  "max_price": raqam,
  "recommendation": "Tavsiya matni"
}}

Faqat JSON qaytaring, boshqa matn yo'q."""

        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "Siz narx strategiyasi mutaxassisisiz. Aniq va foydali tavsiyalar bering."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.5
        )
        
        content = response.choices[0].message.content
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        result = json.loads(content)
        
        return {
            'optimal_price': float(result.get('optimal_price', current_price)),
            'min_price': float(result.get('min_price', cost_price * 1.1)),
            'max_price': float(result.get('max_price', current_price * 1.2)),
            'recommendation': result.get('recommendation', ''),
            'current_price': current_price,
            'profit_margin': profit_margin
        }
        
    except Exception as e:
        logger.error(f"Error generating pricing suggestions: {e}")
        # Fallback calculation
        cost_price = float(product.cost_price or 0)
        return {
            'optimal_price': cost_price * 1.3,
            'min_price': cost_price * 1.1,
            'max_price': cost_price * 1.5,
            'recommendation': 'Narxni xarajat va bozordagi raqobatni hisobga olgan holda belgilang',
            'current_price': float(product.price),
            'profit_margin': ((float(product.price) - cost_price) / float(product.price) * 100) if product.price > 0 else 0
        }








