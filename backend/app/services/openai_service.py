import base64
import json
import os
import tempfile
from typing import Dict, List, Optional
from openai import OpenAI
from PIL import Image
from app.core.config import settings
import logging

# Register HEIF opener with Pillow
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIF_SUPPORTED = True
except ImportError:
    HEIF_SUPPORTED = False
    logging.warning("pillow-heif not installed, HEIC support disabled")

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for OpenAI Vision API integration (direct API, not Azure)."""
    
    def __init__(self):
        self.enabled = bool(settings.OPENAI_API_KEY)
        
        if not self.enabled:
            logger.warning("⚠️ OPENAI_API_KEY not set - AI features disabled")
            self.client = None
            self.model = None
            return
        
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY
        )
        self.model = "gpt-4o"  # Use gpt-4o model
        logger.info("✅ OpenAI service initialized")
    
    def convert_heic_to_jpeg(self, image_path: str) -> str:
        """
        Convert HEIC/HEIF image to JPEG format.
        Returns path to converted JPEG file.
        """
        if not HEIF_SUPPORTED:
            raise ValueError("HEIC format not supported. Please install pillow-heif.")
        
        try:
            # Open HEIC image
            img = Image.open(image_path)
            
            # Convert to RGB if necessary (HEIC might be in different color space)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparency
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Create temporary JPEG file
            temp_dir = os.path.dirname(image_path)
            jpeg_path = os.path.join(temp_dir, os.path.splitext(os.path.basename(image_path))[0] + '_converted.jpg')
            
            # Save as JPEG with high quality
            img.save(jpeg_path, 'JPEG', quality=95)
            logger.info(f"Converted HEIC to JPEG: {jpeg_path}")
            
            return jpeg_path
        except Exception as e:
            logger.error(f"Error converting HEIC to JPEG: {e}")
            raise ValueError(f"HEIC faylni konvertatsiya qilishda xatolik: {str(e)}")
    
    def get_image_format(self, image_path: str) -> str:
        """Detect image format and return MIME type."""
        try:
            with Image.open(image_path) as img:
                format_lower = img.format.lower() if img.format else ''
                
                # Map PIL formats to MIME types
                format_map = {
                    'jpeg': 'image/jpeg',
                    'jpg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'heic': 'image/heic',
                    'heif': 'image/heif',
                }
                
                return format_map.get(format_lower, 'image/jpeg')
        except Exception as e:
            logger.warning(f"Could not detect image format: {e}, defaulting to JPEG")
            return 'image/jpeg'
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def analyze_receipt_image(self, image_path: str) -> Dict:
        """
        Analyze receipt image using OpenAI Vision API (gpt-4o).
        Supports HEIC/HEIF format by converting to JPEG.
        
        Args:
            image_path: Path to the receipt image file
            
        Returns:
            Dictionary containing extracted receipt data
        """
        if not self.enabled:
            logger.warning("OpenAI service is disabled - returning empty result")
            return {"error": "OpenAI service is disabled. Please set OPENAI_API_KEY.", "items": []}
        
        converted_path = None
        try:
            # Check if image is HEIC/HEIF and convert if necessary
            image_format = self.get_image_format(image_path)
            actual_image_path = image_path
            
            if image_format in ('image/heic', 'image/heif'):
                if not HEIF_SUPPORTED:
                    raise ValueError("HEIC format qo'llab-quvvatlanmaydi. Iltimos, pillow-heif paketini o'rnating.")
                logger.info(f"Converting HEIC image: {image_path}")
                converted_path = self.convert_heic_to_jpeg(image_path)
                actual_image_path = converted_path
                image_format = 'image/jpeg'
            
            # Encode image
            base64_image = self.encode_image(actual_image_path)
            
            # Create prompt for receipt analysis
            prompt = """Ushbu chek rasmini tahlil qiling va quyidagi ma'lumotlarni JSON formatida qaytaring:

{
  "store_name": "Do'kon nomi (agar ko'rinsa)",
  "date": "Sana (YYYY-MM-DD formatida)",
  "items": [
    {
      "name": "Mahsulot nomi",
      "quantity": raqam (miqdor - nechta dona yoki kg),
      "unit_price": raqam (birlik narxi - bir dona narxi),
      "total_price": raqam (umumiy narx - quantity * unit_price),
      "recommended_price": raqam (tavsiya etilgan sotish narxi - unit_price dan 20-30% yuqori)
    }
  ],
  "subtotal": raqam (oraliq jami),
  "tax": raqam (soliq, agar bo'lsa),
  "total": raqam (umumiy summa),
  "currency": "Valyuta (UZS, USD, va hokazo)"
}

MUHIM:
- Faqat JSON formatida javob bering, boshqa matn yo'q
- Barcha narxlar raqam bo'lishi kerak (matn emas)
- quantity - mahsulot miqdori (masalan: 1, 2.5, 10)
- unit_price - bir dona narxi
- recommended_price - tavsiya etilgan sotish narxi (unit_price * 1.25 yoki unit_price * 1.30)
- Agar biror ma'lumot aniq ko'rinmasa, null qo'ying
- Mahsulot nomlarini aniq va to'liq yozing
"""
            
            # Use detected format or default to JPEG
            mime_type = image_format if image_format != 'image/heic' else 'image/jpeg'
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1
            )
            
            # Extract response
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from OpenAI")
                return {
                    "store_name": None,
                    "date": None,
                    "items": [],
                    "subtotal": 0.0,
                    "tax": 0.0,
                    "total": 0.0,
                    "currency": "UZS",
                    "error": "AI javob bermadi"
                }
            content = response.choices[0].message.content
            
            # Parse JSON response
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            logger.info(f"Successfully analyzed receipt: {len(result.get('items', []))} items found")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Raw response: {content[:500]}")  # First 500 chars only
            # Try to return a default structure if JSON parsing fails
            return {
                "store_name": None,
                "date": None,
                "items": [],
                "subtotal": 0.0,
                "tax": 0.0,
                "total": 0.0,
                "currency": "UZS"
            }
        except Exception as e:
            logger.error(f"Error analyzing receipt: {e}", exc_info=True)
            # Return empty result instead of raising exception
            return {
                "store_name": None,
                "date": None,
                "items": [],
                "subtotal": 0.0,
                "tax": 0.0,
                "total": 0.0,
                "currency": "UZS",
                "error": str(e)
            }
        finally:
            # Clean up converted temporary file if it was created
            if converted_path and os.path.exists(converted_path):
                try:
                    os.remove(converted_path)
                    logger.debug(f"Cleaned up temporary converted file: {converted_path}")
                except Exception as e:
                    logger.warning(f"Could not remove temporary file {converted_path}: {e}")
    
    def test_connection(self) -> bool:
        """Test OpenAI connection."""
        if not self.enabled:
            logger.warning("OpenAI service is disabled - connection test skipped")
            return False
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=10
            )
            logger.info("OpenAI connection successful")
            return True
        except Exception as e:
            logger.error(f"OpenAI connection failed: {e}")
            return False


# Singleton instance - now gracefully handles missing API key
try:
    openai_service = OpenAIService()
    if openai_service.enabled:
        logger.info("✅ OpenAI service ready")
    else:
        logger.warning("⚠️ OpenAI service disabled (no API key)")
except Exception as e:
    logger.error(f"❌ OpenAI service initialization failed: {e}")
    openai_service = None


def test_connection():
    """Test function for OpenAI connection."""
    if openai_service is None:
        print("❌ OpenAI service not initialized!")
        return False
    
    if openai_service.test_connection():
        print("✅ OpenAI ulanishi muvaffaqiyatli!")
        return True
    else:
        print("❌ OpenAI ulanishida xatolik!")
        return False
