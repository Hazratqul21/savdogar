from app.services.azure_openai_client import azure_openai

class PromoGeneratorService:
    """
    Mahsulotlar uchun reklama matnlarini AI orqali yaratish.
    """
    
    @staticmethod
    async def generate_social_post(product_name: str, price: float, platform: str = "telegram"):
        prompt = f"""
        Mahsulot: {product_name}
        Narxi: {price:,.0f} so'm
        Platforma: {platform}
        
        Ushbu mahsulot uchun {platform} tarmog'iga mos, mijozni jalb qiluvchi chiroyli reklama matni yozib bering. 
        Emoji va hashtaglar ishlating. Matn o'zbek tilida bo'lsin.
        JSON formatda qaytaring: {{"post_content": "..."}}
        """
        
        try:
            result = await azure_openai.generate_json("You are a creative copywriter.", prompt)
            return result.get("post_content", "Xatolik yuz berdi")
        except Exception as e:
            return f"Xatolik: {str(e)}"
