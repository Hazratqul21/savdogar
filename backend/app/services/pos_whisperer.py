from sqlalchemy.orm import Session
from app.services.azure_openai_client import azure_openai
from app.models.customer_v2 import CustomerV2
from app.models.sale_v2 import SaleV2, SaleItemV2

class POSWhispererService:
    """
    Smart Whisperer: Kassa xodimiga real-vaqtda aqlli yordamchi.
    Mijozga nima deyish kerakligini AI orqali aytib turadi.
    """

    @staticmethod
    async def get_customer_tip(db: Session, customer_id: int):
        customer = db.query(CustomerV2).filter(CustomerV2.id == customer_id).first()
        if not customer:
            return None

        # Oxirgi sotib olgan narsalari
        last_sales = db.query(SaleV2).filter(SaleV2.customer_id == customer_id).order_by(SaleV2.created_at.desc()).limit(3).all()
        history_str = ""
        for s in last_sales:
            items = db.query(SaleItemV2).filter(SaleItemV2.sale_id == s.id).all()
            history_str += f"- {', '.join([i.variant.sku for i in items])}\n"

        prompt = f"""
        Mijoz: {customer.name}
        Xarid tarixi:\n{history_str}
        
        Kassa xodimiga ushbu mijoz bo'yicha 1 ta juda qisqa va aqlli maslahat bering (o'zbek tilida).
        Mijozni qanday xursand qilish yoki unga qo'shimcha nima taklif qilish mumkin? 
        Javob 1 tagacha gap bo'lsin.
        """
        
        system_prompt = "Siz tajribali kassa administratori va sales-coachsiz."
        tip = await azure_openai.generate_text(system_prompt, prompt)
        
        return tip
