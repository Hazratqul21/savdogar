from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.sale_v2 import SaleV2
from app.services.azure_openai_client import azure_openai

class DailyStrategyService:
    """
    Kundalik savdolarni tahlil qilish va AI orqali strategiya berish.
    """
    
    @staticmethod
    async def generate_daily_report(db: Session, tenant_id: int):
        # 1. Kechagi savdo ma'lumotlarini yig'ish
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        sales = db.query(SaleV2).filter(
            SaleV2.tenant_id == tenant_id,
            func.date(SaleV2.created_at) == yesterday
        ).all()
        
        total_revenue = sum(s.total_amount for s in sales)
        sale_count = len(sales)
        avg_check = total_revenue / sale_count if sale_count > 0 else 0
        
        # 2. AI uchun ma'lumot tayyorlash
        stats_text = f"""
        Sana: {yesterday}
        Jami savdo: {total_revenue:,.0f} so'm
        Sotuvlar soni: {sale_count}
        O'rtacha check: {avg_check:,.0f} so'm
        """
        
        prompt = f"""
        Siz Savdogar POS tizimining aqlli tahlilchisisiz. 
        Kechagi savdo ko'rsatkichlari: {stats_text}
        
        Ushbu ko'rsatkichlar asosida do'kon egasiga BUGUN uchun 3 ta aniq tavsiya bering. 
        Tavsiyalar o'zbek tilida, professional va dalillangan bo'lsin.
        Javobni FAQAT JSON formatida qaytaring: {{"strategy": ["tavsiya 1", "tavsiya 2", "tavsiya 3"]}}
        """
        
        try:
            result = await azure_openai.generate_json("You are a business strategist.", prompt)
            return {
                "stats": {
                    "revenue": total_revenue,
                    "count": sale_count,
                    "avg_check": avg_check
                },
                "strategy": result.get("strategy", ["Ma'lumot kam"])
            }
        except Exception as e:
            return {"error": str(e)}
