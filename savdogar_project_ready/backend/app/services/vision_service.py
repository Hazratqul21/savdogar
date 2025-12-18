import base64
from app.services.azure_openai_client import azure_openai

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

        # GPT-4o Vision call (Shartli ravishda azure_openai kengaytirildi)
        # Eslatma: Azure OpenAI client vision modelini qo'llab-quvvatlashi kerak
        messages = [
            {"role": "system", "content": "Siz yuqori aniqlikdagi vizual tahlilchisiz."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
        
        # Real call simulation (keylar faolligi hisobga olindi)
        response = await azure_openai.client.chat.completions.create(
            model=azure_openai.deployment_name,
            messages=messages,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
