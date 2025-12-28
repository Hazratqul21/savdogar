from duckduckgo_search import DDGS
from typing import Optional

class ImageFinderService:
    def find_product_image(self, product_name: str) -> Optional[str]:
        """
        Mahsulot nomi bo'yicha internetdan rasm qidirish
        """
        try:
            with DDGS() as ddgs:
                # "product" so'zini qo'shib qidiramiz aniqroq bo'lishi uchun
                query = f"{product_name} product image"
                results = list(ddgs.images(
                    query,
                    max_results=1,
                    safesearch="off",
                    size="Medium",
                    type_image="photo"
                ))
                
                if results and len(results) > 0:
                    return results[0]['image']
                    
        except Exception as e:
            print(f"Error finding image for {product_name}: {e}")
            
        return None

image_finder = ImageFinderService()
