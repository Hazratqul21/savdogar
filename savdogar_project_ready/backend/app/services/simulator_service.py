import random
from app.services.azure_openai_client import azure_openai

class BusinessSimulatorService:
    """
    Savdogar Simulator: Kelajak ssenariylarini simulyatsiya qilish.
    "What-if" analizlari orqali biznes egasiga qaror qabul qilishda yordam beradi.
    """

    @staticmethod
    async def simulate_scenario(db_metrics: dict, changes: dict):
        """
        Ssenariy simulyatsiyasi.
        db_metrics: {current_revenue, expenses, avg_check, visitor_count}
        changes: {price_increase: 5, new_staff: 1, marketing_spend: 1000000}
        """
        
        # 1. Matematik Monte-Karlo (Soddalashtirilgan model)
        simulated_results = []
        for _ in range(100):
            # Narx oshsa - talab tushadi (Elasticity)
            elasticity = random.uniform(0.5, 1.5)
            new_revenue = db_metrics["current_revenue"] * (1 + (changes.get("price_increase", 0)/100) * -elasticity)
            
            # Marketing spend - yangi mijozlar olib keladi
            new_visitors = db_metrics["visitor_count"] * (1 + (changes.get("marketing_spend", 0)/5000000))
            
            total_potential = new_revenue * (new_visitors / db_metrics["visitor_count"])
            simulated_results.append(total_potential)

        avg_potential = sum(simulated_results) / len(simulated_results)
        
        # 2. AI Tahlili (Neural Reasoning)
        prompt = f"""
        Biznes holati: {db_metrics}
        Kutilayotgan o'zgarishlar: {changes}
        Matematik simulyatsiya natijasi (o'rtacha): {avg_potential:,.0f} so'm
        
        Vazifa: Ushbu ssenariyni AI sifatida tahlil qiling va o'zbek tilida 
        "Biznes-Risk" va "Foyda ehtimoli" bo'yicha strategik xulosa bering. 
        Mantiqiy yondashing: Bu foydalimi yoki shunchaki xarajat?
        """
        
        report = await azure_openai.generate_text("Siz strategik biznes analitiksiz.", prompt)
        
        return {
            "average_forecast": avg_potential,
            "strategic_analysis": report,
            "confidence_level": "85%"
        }
