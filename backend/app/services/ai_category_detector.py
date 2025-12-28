"""
AI Category Detection Service
Automatically detects and suggests categories for products
"""

from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.models import Product, Category
from app.services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)


def detect_product_category(
    db: Session,
    product_name: str,
    description: Optional[str] = None,
    barcode: Optional[str] = None
) -> Dict:
    """
    Detect product category using AI based on name, description, and barcode.
    
    Args:
        db: Database session
        product_name: Product name
        description: Optional product description
        barcode: Optional barcode
    
    Returns:
        Dictionary with suggested category and confidence
    """
    try:
        # Get existing categories
        categories = db.query(Category).all()
        category_list = [cat.name for cat in categories]
        
        # Build prompt
        prompt = f"""Siz mahsulot katalogizatsiya mutaxassisisiz. Quyidagi mahsulotni to'g'ri kategoriyaga joylashtiring.

MAHSULOT:
- Nomi: {product_name}
{f"- Tavsif: {description}" if description else ""}
{f"- Barcode: {barcode}" if barcode else ""}

MAVJUD KATEGORIYALAR:
{chr(10).join([f"- {cat}" for cat in category_list]) if category_list else "Kategoriyalar hali yaratilmagan"}

VAZIFA:
1. Agar mavjud kategoriyalardan biri mos kelsa, uni tanlang
2. Agar mos kategoriya yo'q bo'lsa, yangi kategoriya nomini taklif qiling
3. Ishonch darajasini belgilang (0-100)

JSON formatida javob bering:
{{
  "category_name": "Kategoriya nomi (mavjud yoki yangi)",
  "is_existing": true/false,
  "confidence": 85,
  "reason": "Nima uchun bu kategoriya"
}}

Faqat JSON qaytaring, boshqa matn yo'q."""

        # Call AI
        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "Siz mahsulot katalogizatsiya mutaxassisisiz. Aniq kategoriyalarni tanlang."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        result = json.loads(content)
        
        category_name = result.get('category_name', '').strip()
        is_existing = result.get('is_existing', False)
        confidence = result.get('confidence', 0)
        reason = result.get('reason', '')
        
        # Find or create category
        category = None
        if is_existing and category_list:
            # Try to find existing category (fuzzy match)
            for cat in categories:
                if cat.name.lower() == category_name.lower() or category_name.lower() in cat.name.lower():
                    category = cat
                    break
        
        if not category:
            # Check if category exists (case-insensitive)
            category = db.query(Category).filter(
                Category.name.ilike(f"%{category_name}%")
            ).first()
        
        return {
            'category_id': category.id if category else None,
            'category_name': category.name if category else category_name,
            'is_existing': category is not None,
            'confidence': confidence,
            'reason': reason,
            'should_create': not category and confidence > 70
        }
        
    except Exception as e:
        logger.error(f"Error detecting category: {e}")
        return {
            'category_id': None,
            'category_name': None,
            'is_existing': False,
            'confidence': 0,
            'reason': 'Xatolik yuz berdi',
            'should_create': False
        }


def batch_detect_categories(
    db: Session,
    products: List[Dict]
) -> List[Dict]:
    """
    Batch detect categories for multiple products.
    
    Args:
        db: Database session
        products: List of products with name, description, etc.
    
    Returns:
        List of category detection results
    """
    results = []
    for product in products:
        result = detect_product_category(
            db,
            product.get('name', ''),
            product.get('description'),
            product.get('barcode')
        )
        result['product_name'] = product.get('name', '')
        results.append(result)
    
    return results








