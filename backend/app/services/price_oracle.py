from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product_v2 import ProductVariant
from app.models.sale_v2 import SaleItemV2

class PriceOracleService:
    """
    Mukammal Narx Mantiqi: Tovar sotilish tezligi va foyda marjasi asosida
    optimal narxni bashorat qilish.
    """

    @staticmethod
    def analyze_price_elasticity(db: Session, variant_id: int):
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            return None

        # Sotuv tezligi (Velocity Score avvalgi bosqichda qo'shilgan)
        velocity = variant.velocity_score or 0.0
        
        # Mantiq: 
        # 1. Agar velocity juda yuqori bo'lsa (> 10 dona/kun) va stock < 50 dona 
        #    -> Narxni 2-5% ga oshirishni tavsiya qilish (High Demand).
        # 2. Agar velocity juda past bo'lsa (< 0.5 dona/kun) va stock > 100 dona
        #    -> Narxni 5-10% ga tushirish yoki chegirma qilishni taklif qilish (Dead Stock).

        recommendation = {
            "current_price": variant.price,
            "suggested_action": "KEEP",
            "suggested_price": variant.price,
            "reason": "Narx hozirda barqaror."
        }

        if velocity > 5.0 and variant.stock_quantity < 20:
            recommendation["suggested_action"] = "INCREASE"
            recommendation["suggested_price"] = variant.price * 1.05
            recommendation["reason"] = "Talab yuqori, zaxira oz. Narxni oshirish tavsiya etiladi."
        
        elif velocity < 0.2 and variant.stock_quantity > 50:
            recommendation["suggested_action"] = "DECREASE"
            recommendation["suggested_price"] = variant.price * 0.90
            recommendation["reason"] = "Tovar juda sekin sotilmoqda. Chegirma orqali aylanmani tezlashtiring."

        return recommendation
