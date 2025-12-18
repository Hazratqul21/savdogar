import httpx
from typing import Optional, Dict, Any

class ProductLookupService:
    BASE_URL = "https://world.openfoodfacts.org/api/v0/product"

    async def lookup_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """
        OpenFoodFacts API orqali mahsulotni shtrix-kod bo'yicha qidirish
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.BASE_URL}/{barcode}.json")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("status") == 1:
                        product = data.get("product", {})
                        
                        # Kerakli ma'lumotlarni ajratib olish
                        return {
                            "name": product.get("product_name", "") or product.get("product_name_uz", ""),
                            "barcode": barcode,
                            "image_url": product.get("image_url", ""),
                            "category": product.get("categories", "").split(",")[0] if product.get("categories") else "Boshqa",
                            "brand": product.get("brands", ""),
                            "description": product.get("generic_name", "")
                        }
        except Exception as e:
            print(f"Error looking up product: {e}")
            
        return None

product_lookup = ProductLookupService()
