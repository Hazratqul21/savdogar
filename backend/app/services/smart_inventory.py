"""
Smart Inventory Management Service
AI-powered stock prediction and order suggestions
"""

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models import Product, Sale, SaleItem
from app.services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)


def predict_stockouts(
    db: Session,
    organization_id: int,
    days_ahead: int = 7
) -> List[Dict]:
    """
    Predict which products will run out of stock.
    
    Args:
        db: Database session
        organization_id: Organization ID
        days_ahead: How many days ahead to predict
    
    Returns:
        List of predictions with days until stockout and suggested order quantity
    """
    try:
        # Get all active products for this organization
        products = db.query(Product).filter(
            Product.organization_id == organization_id,
            Product.stock_quantity > 0
        ).all()
        
        if not products:
            return []
        
        # Get sales history for last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        
        predictions = []
        for product in products:
            # Calculate daily average sales
            sales_data = db.query(
                func.sum(SaleItem.quantity).label('total_qty'),
                func.count(SaleItem.sale_id).label('sale_count')
            ).join(Sale).filter(
                SaleItem.product_id == product.id,
                Sale.organization_id == organization_id,
                Sale.created_at >= start_date
            ).first()
            
            total_sold = float(sales_data[0] or 0)
            sale_count = int(sales_data[1] or 0)
            
            # Calculate daily average
            if sale_count > 0:
                daily_avg = total_sold / 30
            else:
                # No sales history, use conservative estimate
                daily_avg = product.stock_quantity / 60  # Assume 60 days if no sales
            
            # Calculate days until stockout
            if daily_avg > 0:
                days_until_stockout = int(product.stock_quantity / daily_avg)
            else:
                days_until_stockout = 999  # No sales, won't stockout soon
            
            # Only include products that will stockout within days_ahead
            if days_until_stockout <= days_ahead:
                # Calculate suggested order quantity (30 days supply)
                suggested_qty = max(daily_avg * 30, product.stock_quantity * 2)
                
                # Calculate confidence based on sales history
                confidence = min(100, sale_count * 5)  # More sales = higher confidence
                
                predictions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': float(product.stock_quantity),
                    'days_until_stockout': days_until_stockout,
                    'daily_average_sales': round(daily_avg, 2),
                    'suggested_order_quantity': round(suggested_qty, 2),
                    'confidence': confidence,
                    'unit': product.unit,
                    'urgency': 'high' if days_until_stockout <= 3 else 'medium' if days_until_stockout <= 5 else 'low'
                })
        
        # Sort by urgency
        predictions.sort(key=lambda x: x['days_until_stockout'])
        
        return predictions
        
    except Exception as e:
        logger.error(f"Error predicting stockouts: {e}")
        return []


def get_order_suggestions(
    db: Session,
    organization_id: int
) -> Dict:
    """
    Get AI-powered order suggestions based on sales trends and seasonality.
    
    Args:
        db: Database session
        organization_id: Organization ID
    
    Returns:
        Dictionary with order suggestions and analysis
    """
    try:
        # Get stockout predictions
        predictions = predict_stockouts(db, organization_id, days_ahead=14)
        
        # Get low stock products
        low_stock = db.query(Product).filter(
            Product.organization_id == organization_id,
            Product.stock_quantity < 10
        ).all()
        
        # Get sales trends for last 90 days
        start_date = datetime.utcnow() - timedelta(days=90)
        
        # Prepare data for AI analysis
        products_data = []
        for product in low_stock + [p for p in db.query(Product).filter(Product.organization_id == organization_id).all() if p.id in [pred['product_id'] for pred in predictions]]:
            sales_data = db.query(
                func.sum(SaleItem.quantity).label('total_qty'),
                func.sum(SaleItem.total).label('total_revenue')
            ).join(Sale).filter(
                SaleItem.product_id == product.id,
                Sale.organization_id == organization_id,
                Sale.created_at >= start_date
            ).first()
            
            products_data.append({
                'name': product.name,
                'current_stock': float(product.stock_quantity),
                'price': float(product.price),
                'total_sold_90d': float(sales_data[0] or 0),
                'revenue_90d': float(sales_data[1] or 0)
            })
        
        # Use AI to analyze and suggest orders
        prompt = f"""Siz inventarizatsiya mutaxassisisiz. Quyidagi mahsulotlar uchun buyurtma tavsiyalari bering.

MAHSULOTLAR:
{chr(10).join([f"- {p['name']}: Omborda {p['current_stock']} dona, 90 kun ichida {p['total_sold_90d']:.0f} dona sotilgan" for p in products_data[:20]])}

VAZIFA:
1. Qaysi mahsulotlarni darhol buyurtma qilish kerakligini aniqlang
2. Har bir mahsulot uchun optimal buyurtma miqdorini tavsiya qiling
3. Buyurtma prioritetini belgilang (1-10, 1 eng yuqori)
4. Qisqa sabab bering

JSON formatida javob bering:
{{
  "suggestions": [
    {{
      "product_name": "Mahsulot nomi",
      "suggested_quantity": raqam,
      "priority": 1-10,
      "reason": "Sabab"
    }}
  ],
  "total_estimated_cost": raqam,
  "summary": "Qisqa xulosa"
}}

Faqat JSON qaytaring, boshqa matn yo'q."""

        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "Siz inventarizatsiya mutaxassisisiz. Aniq va foydali buyurtma tavsiyalari bering."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.5
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        ai_result = json.loads(content)
        
        # Match suggestions with actual products
        suggestions = []
        for sug in ai_result.get('suggestions', []):
            product = db.query(Product).filter(
                Product.name.ilike(f"%{sug.get('product_name', '')}%"),
                Product.organization_id == organization_id
            ).first()
            
            if product:
                suggestions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': float(product.stock_quantity),
                    'suggested_quantity': float(sug.get('suggested_quantity', 0)),
                    'priority': int(sug.get('priority', 5)),
                    'reason': sug.get('reason', ''),
                    'estimated_cost': float(product.cost_price or product.price) * float(sug.get('suggested_quantity', 0))
                })
        
        # Sort by priority
        suggestions.sort(key=lambda x: x['priority'])
        
        total_cost = sum(s['estimated_cost'] for s in suggestions)
        
        return {
            'suggestions': suggestions,
            'total_estimated_cost': total_cost,
            'summary': ai_result.get('summary', ''),
            'predicted_stockouts': len(predictions),
            'low_stock_count': len(low_stock)
        }
        
    except Exception as e:
        logger.error(f"Error generating order suggestions: {e}")
        # Fallback: simple suggestions based on predictions
        predictions = predict_stockouts(db, organization_id, days_ahead=7)
        suggestions = []
        for pred in predictions[:10]:
            product = db.query(Product).filter(Product.id == pred['product_id']).first()
            if product:
                suggestions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': pred['current_stock'],
                    'suggested_quantity': pred['suggested_order_quantity'],
                    'priority': 1 if pred['urgency'] == 'high' else 5,
                    'reason': f"Omborda {pred['days_until_stockout']} kundan keyin tugaydi",
                    'estimated_cost': float(product.cost_price or product.price) * pred['suggested_order_quantity']
                })
        
        return {
            'suggestions': suggestions,
            'total_estimated_cost': sum(s['estimated_cost'] for s in suggestions),
            'summary': f"{len(suggestions)} ta mahsulot uchun buyurtma tavsiya qilinadi",
            'predicted_stockouts': len(predictions),
            'low_stock_count': len([p for p in suggestions if p['current_stock'] < 10])
        }


def get_inventory_alerts(
    db: Session,
    organization_id: int
) -> Dict:
    """
    Get inventory alerts (low stock, out of stock, expiring soon).
    
    Args:
        db: Database session
        organization_id: Organization ID
    
    Returns:
        Dictionary with different types of alerts
    """
    try:
        products = db.query(Product).filter(
            Product.organization_id == organization_id
        ).all()
        
        alerts = {
            'out_of_stock': [],
            'low_stock': [],
            'high_stock': []
        }
        
        for product in products:
            if product.stock_quantity <= 0:
                alerts['out_of_stock'].append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'stock': float(product.stock_quantity),
                    'unit': product.unit
                })
            elif product.stock_quantity < 10:
                alerts['low_stock'].append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'stock': float(product.stock_quantity),
                    'unit': product.unit
                })
            elif product.stock_quantity > 1000:  # Arbitrary threshold
                alerts['high_stock'].append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'stock': float(product.stock_quantity),
                    'unit': product.unit
                })
        
        return {
            'alerts': alerts,
            'total_alerts': len(alerts['out_of_stock']) + len(alerts['low_stock']),
            'out_of_stock_count': len(alerts['out_of_stock']),
            'low_stock_count': len(alerts['low_stock']),
            'high_stock_count': len(alerts['high_stock'])
        }
        
    except Exception as e:
        logger.error(f"Error getting inventory alerts: {e}")
        return {
            'alerts': {'out_of_stock': [], 'low_stock': [], 'high_stock': []},
            'total_alerts': 0,
            'out_of_stock_count': 0,
            'low_stock_count': 0,
            'high_stock_count': 0
        }






