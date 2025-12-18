from sqlalchemy.orm import Session
from app.services.azure_openai_client import azure_openai
from app.models.sale_v2 import SaleV2
from app.models.customer_v2 import CustomerV2
from sqlalchemy import func

class CFOAgentService:
    """
    Savdogar CFO: Moliyaviy maslahatchi va strateg.
    Chuqur mantiqiy tahlil orqali biznesni o'stirish bo'yicha maslahat beradi.
    """

    @staticmethod
    async def generate_boardroom_report(db: Session, tenant_id: int):
        # 1. Moliyaviy ma'lumotlarni yig'ish
        total_sales = db.query(func.sum(SaleV2.total_amount)).filter(SaleV2.tenant_id == tenant_id).scalar() or 0
        total_debt = db.query(func.sum(CustomerV2.balance)).filter(CustomerV2.tenant_id == tenant_id, CustomerV2.balance < 0).scalar() or 0
        customer_count = db.query(func.count(CustomerV2.id)).filter(CustomerV2.tenant_id == tenant_id).scalar() or 0
        
        # 2. GPT-4o orqali "Deep Reasoning" (Mukammal mantiq)
        prompt = f"""
        Siz "Savdogar" tizimining Avtonom Moliyaviy Direktori (CFO) emassiz.
        Hozirgi holat:
        - Jami savdo: {total_sales:,.0f} so'm
        - Mijozlar qarzi: {abs(total_debt):,.0f} so'm
        - Jami mijozlar: {customer_count} ta
        
        Vazifa: Ushbu biznes egasiga chuqur, strategik va o'zbek tilida 3 ta maslahat bering. 
        Mantiqiy tahlil qiling: 
        - Qarzlar savdoga nisbatan qanday holda? 
        - Biznesni kengaytirish uchun hozir vaqtmi? 
        - Soliqlardan qochish emas, balki foydani qanday qonuniy maksimal qilish mumkin?
        
        Javobni professional biznes tilida (markdown) qaytaring.
        """
        
        system_prompt = "Siz tajribali moliyaviy direktor va biznes strategisiz."
        report = await azure_openai.generate_text(system_prompt, prompt)
        
        return {
            "cfo_report": report,
            "metrics": {
                "health_score": "HEALTHY" if abs(total_debt) < (total_sales * 0.2) else "RISKY",
                "debt_to_sales_ratio": f"{(abs(total_debt) / total_sales) * 100:.1f}%" if total_sales > 0 else "0%"
            }
        }
