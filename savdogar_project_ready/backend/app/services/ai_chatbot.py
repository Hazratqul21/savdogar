"""
AI Chatbot Service
Provides intelligent assistant for business questions
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import Sale, Product, SaleItem, Customer, InventoryMovement
from app.services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)


def get_business_context(db: Session, organization_id: Optional[int] = None) -> str:
    """Get current business context for chatbot."""
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    # Build base query
    sales_query = db.query(Sale).filter(Sale.created_at >= start_of_day)
    products_query = db.query(Product)
    
    if organization_id is not None:
        sales_query = sales_query.filter(Sale.organization_id == organization_id)
        products_query = products_query.filter(Product.organization_id == organization_id)
    
    # Today's sales
    today_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= start_of_day,
        *([Sale.organization_id == organization_id] if organization_id is not None else [])
    ).scalar() or 0
    
    today_transactions = db.query(func.count(Sale.id)).filter(
        Sale.created_at >= start_of_day,
        *([Sale.organization_id == organization_id] if organization_id is not None else [])
    ).scalar() or 0
    
    # Low stock products
    low_stock_query = products_query.filter(Product.stock_quantity < 10)
    low_stock = low_stock_query.limit(5).all()
    
    # Top products today
    top_query = db.query(
        Product.name,
        func.sum(SaleItem.quantity).label('qty')
    ).join(SaleItem).join(Sale).filter(
        Sale.created_at >= start_of_day
    )
    
    if organization_id is not None:
        top_query = top_query.filter(Sale.organization_id == organization_id)
    
    top_today = top_query.group_by(Product.name).order_by(
        func.sum(SaleItem.quantity).desc()
    ).limit(3).all()
    
    context = f"""BUGUNGI STATISTIKA:
- Savdo: {today_sales:,.0f} so'm
- Tranzaksiyalar: {today_transactions} ta
- Eng ko'p sotilgan: {', '.join([p[0] for p in top_today]) if top_today else 'Yo\'q'}
- Kam zaxira: {len(low_stock)} ta mahsulot"""
    
    return context


def chat_with_ai(
    db: Session,
    user_message: str,
    organization_id: Optional[int] = None,
    conversation_history: Optional[List[Dict]] = None
) -> Dict:
    """
    Chat with AI assistant about business.
    
    Args:
        db: Database session
        user_message: User's message
        conversation_history: Previous messages in conversation
    
    Returns:
        AI response with message and suggestions
    """
    try:
        # Get business context
        context = get_business_context(db, organization_id)
        
        # Build conversation
        messages = [
            {
                "role": "system",
                "content": """Siz SmartPOS CRM tizimining AI yordamchisisiz. 
Siz do'kon boshqaruvi, savdo, ombor, mahsulotlar va statistika haqida savollarga javob berasiz.
O'zbek tilida, qisqa va aniq javoblar bering.
Agar ma'lumot kerak bo'lsa, tizimdan olishni taklif qiling."""
            }
        ]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current context and user message
        messages.append({
            "role": "user",
            "content": f"""{context}

MIJOZ SAVOLI: {user_message}

Javob bering va kerak bo'lsa, qo'shimcha ma'lumot olish uchun takliflar bering."""
        })
        
        # Call AI
        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        ai_message = response.choices[0].message.content
        
        # Extract suggestions if any
        suggestions = extract_suggestions(ai_message)
        
        return {
            'message': ai_message,
            'suggestions': suggestions,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        return {
            'message': "Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            'suggestions': [],
            'timestamp': datetime.utcnow().isoformat()
        }


def extract_suggestions(message: str) -> List[str]:
    """Extract action suggestions from AI message."""
    suggestions = []
    
    # Common suggestions based on keywords
    if 'statistika' in message.lower() or 'hisobot' in message.lower():
        suggestions.append('Statistikani ko\'rish')
    
    if 'mahsulot' in message.lower() or 'ombor' in message.lower():
        suggestions.append('Mahsulotlar ro\'yxati')
    
    if 'savdo' in message.lower() or 'tranzaksiya' in message.lower():
        suggestions.append('Savdo tarixi')
    
    if 'zaxira' in message.lower() or 'kam' in message.lower():
        suggestions.append('Kam zaxira mahsulotlar')
    
    return suggestions[:3]


def get_quick_answers(db: Session, question_type: str, organization_id: Optional[int] = None) -> Dict:
    """Get quick answers for common questions."""
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    if question_type == 'today_sales':
        total_query = db.query(func.sum(Sale.total_amount)).filter(
            Sale.created_at >= start_of_day
        )
        count_query = db.query(func.count(Sale.id)).filter(
            Sale.created_at >= start_of_day
        )
        
        if organization_id is not None:
            total_query = total_query.filter(Sale.organization_id == organization_id)
            count_query = count_query.filter(Sale.organization_id == organization_id)
        
        total = total_query.scalar() or 0
        count = count_query.scalar() or 0
        return {
            'answer': f"Bugun {count} ta tranzaksiya bo'ldi, jami {total:,.0f} so'm",
            'type': 'statistics'
        }
    
    elif question_type == 'low_stock':
        low_stock_query = db.query(Product).filter(
            Product.stock_quantity < 10
        )
        if organization_id is not None:
            low_stock_query = low_stock_query.filter(Product.organization_id == organization_id)
        low_stock = low_stock_query.limit(10).all()
        if low_stock:
            names = ', '.join([p.name for p in low_stock[:5]])
            return {
                'answer': f"Kam zaxira mahsulotlar: {names}",
                'type': 'warning',
                'products': [{'id': p.id, 'name': p.name, 'stock': float(p.stock_quantity)} for p in low_stock]
            }
        return {
            'answer': "Barcha mahsulotlar yetarli miqdorda",
            'type': 'success'
        }
    
    elif question_type == 'top_products':
        top_query = db.query(
            Product.name,
            func.sum(SaleItem.quantity).label('qty')
        ).join(SaleItem).join(Sale).filter(
            Sale.created_at >= start_of_day
        )
        if organization_id is not None:
            top_query = top_query.filter(Sale.organization_id == organization_id)
        top = top_query.group_by(Product.name).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(5).all()
        
        if top:
            answer = "Eng ko'p sotilgan mahsulotlar:\n" + "\n".join([
                f"- {p[0]}: {p[1]:.0f} dona" for p in top
            ])
            return {'answer': answer, 'type': 'statistics'}
        
        return {'answer': "Bugun hali savdo bo'lmagan", 'type': 'info'}
    
    return {'answer': "Savolni aniqlashtirib bering", 'type': 'info'}



