import base64
from app.services.openai_client import openai_client

class VisionService:
    """
    Savdogar Vision: Rassmlarni ko'rish va tushunish mantiqi.
    Invoice, tokcha yoki mahsulot rasmiga qarab ma'lumotlarni aniqlaydi.
    """

    @staticmethod
    async def process_image_to_data(image_bytes: bytes, context: str = "inventory"):
        # Rasmni base64 formatiga o'tkazish
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = ""
        if context == "inventory":
            prompt = """
            Ushbu rasmda ko'rinib turgan mahsulotlarni va ularning miqdorini tahlil qiling. 
            Agar bu faktura (invoice) bo'lsa, jadvaldagi barcha ma'lumotlarni sug'urib oling.
            Natijani faqat JSON formatda qaytaring: {"items": [{"name": "...", "qty": "...", "price": "..."}]}
            """
        elif context == "shelf":
            prompt = """
            Ombor tokchasidagi mahsulotlar holatini tahlil qiling. Qaysi joylar bo'sh? 
            Nima tugayotganini aniqlang va o'zbek tilida qisqa hisobot bering.
            """

        # GPT-4o Vision call using OpenAI client
        system_prompt = "Siz yuqori aniqlikdagi vizual tahlilchisiz."
        image_url = f"data:image/jpeg;base64,{base64_image}"
        
        result = await openai_client.analyze_image(system_prompt, image_url)
        return result.get("raw_analysis", str(result))
