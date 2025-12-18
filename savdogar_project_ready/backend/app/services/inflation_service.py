from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.models.product_v2 import ProductVariant

class InflationShieldService:
    """
    Dollar kursiga bog'liq narxlarni avtomatik yangilash xizmati.
    Inflyatsiyadan himoya qilish uchun.
    """
    
    @staticmethod
    def update_tenant_exchange_rate(db: Session, tenant_id: int, new_rate: float):
        """Dollar kursini yangilash va barcha bog'liq narxlarni qayta hisoblash"""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return None
            
        old_rate = tenant.usd_to_uzs_rate
        tenant.usd_to_uzs_rate = new_rate
        
        # Barcha product variantlarini topish
        # Agar narx dollarda saqlangan bo'lsa (masalan attributes da 'price_usd' bo'lsa)
        # biz joriy so'mdagi 'price' ni yangilab chiqamiz.
        
        variants = db.query(ProductVariant).filter(ProductVariant.tenant_id == tenant_id).all()
        for variant in variants:
            price_usd = variant.attributes.get('price_usd')
            if price_usd:
                # Yangi kurs bo'yicha so'mdagi narxni hisoblash
                variant.price = float(price_usd) * new_rate
        
        db.commit()
        return tenant

    @staticmethod
    def calculate_price_by_usd(usd_price: float, current_rate: float):
        """Dollar narxini so'mga o'girish"""
        return usd_price * current_rate
