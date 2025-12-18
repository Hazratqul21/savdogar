"""
Pricing Service - Narx hisoblash logikasi
PriceTiers ni tekshiradi va eng yaxshi narxni tanlaydi
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.product_v2 import ProductVariant
from app.models.pricing import PriceTier, PriceTierType
from app.models.customer_v2 import Customer, CustomerTier


def get_best_price(
    db: Session,
    variant: ProductVariant,
    quantity: float,
    customer: Optional[Customer] = None,
) -> tuple[float, Optional[PriceTier]]:
    """
    Eng yaxshi narxni topish
    Returns: (price, applied_tier)
    """
    # Default narx
    best_price = variant.price
    applied_tier = None
    
    # PriceTier ni qidirish
    tier_query = db.query(PriceTier).filter(
        and_(
            PriceTier.variant_id == variant.id,
            PriceTier.min_quantity <= quantity,
        )
    )
    
    # Maksimal miqdor tekshirish
    tier_query = tier_query.filter(
        (PriceTier.max_quantity == None) | (PriceTier.max_quantity >= quantity)
    )
    
    # Mijoz guruhi tekshirish
    if customer:
        if customer.price_tier == CustomerTier.WHOLESALER:
            tier_query = tier_query.filter(
                (PriceTier.customer_group == None) | 
                (PriceTier.customer_group == "wholesale") |
                (PriceTier.tier_type == PriceTierType.WHOLESALER)
            )
        elif customer.price_tier == CustomerTier.VIP:
            tier_query = tier_query.filter(
                (PriceTier.customer_group == None) | 
                (PriceTier.customer_group == "vip") |
                (PriceTier.tier_type == PriceTierType.VIP)
            )
    
    # Eng yaxshi narxni tanlash (eng katta min_quantity - eng katta chegirma)
    tier = tier_query.order_by(PriceTier.min_quantity.desc()).first()
    
    if tier:
        best_price = tier.price
        applied_tier = tier
    
    return best_price, applied_tier


def calculate_item_total(
    unit_price: float,
    quantity: float,
    tax_rate: float = 0.0,
    discount_percent: float = 0.0,
    discount_amount: float = 0.0,
) -> Dict[str, float]:
    """
    Element jami summasini hisoblash
    Returns: {
        'subtotal': ...,
        'discount': ...,
        'tax': ...,
        'total': ...
    }
    """
    # Element jami (chegirmadan oldin)
    item_subtotal = unit_price * quantity
    
    # Chegirma
    if discount_percent > 0:
        discount = item_subtotal * (discount_percent / 100)
    else:
        discount = discount_amount
    
    # Chegirmadan keyin
    after_discount = item_subtotal - discount
    
    # Soliq
    tax = after_discount * (tax_rate / 100)
    
    # Jami
    total = after_discount + tax
    
    return {
        'subtotal': item_subtotal,
        'discount': discount,
        'tax': tax,
        'total': total,
    }








