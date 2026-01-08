"""
Hybrid OpenAI Client for Invoice Scanner
Supports cost-optimized model selection:
- gpt-4o-mini: Fast and cost-effective for printed invoices
- gpt-4o: High precision for handwritten invoices
"""
from openai import AsyncOpenAI
from app.core.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
import json
from typing import Dict, Any, Literal, Optional

logger = logging.getLogger(__name__)

class HybridOpenAIClient:
    """
    Hybrid OpenAI client that selects models based on invoice type.
    Optimized for cost and accuracy.
    """
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for hybrid invoice scanner")
        
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def analyze_invoice_image(
        self, 
        image_url: Optional[str] = None,
        image_data: Optional[bytes] = None, 
        filename: Optional[str] = None,
        mode: Literal["printed", "handwritten"] = "printed"
    ) -> Dict[str, Any]:
        """
        Analyze invoice image with hybrid model selection.
        
        Args:
            image_url: Public URL to image (Supabase Storage URL) - preferred
            image_data: Image bytes (fallback if URL not provided)
            filename: Original filename (for MIME type detection)
            mode: "printed" for gpt-4o-mini (fast, cost-effective) 
                  "handwritten" for gpt-4o (high precision)
        
        Returns:
            Dict with items array: [{"product_name": str, "quantity": float, "price": float, "unit": str}]
        """
        import base64
        
        # Select model based on mode
        model = "gpt-4o-mini" if mode == "printed" else "gpt-4o"
        
        # Determine image URL - prefer Supabase URL, fallback to base64
        if image_url:
            # Use Supabase Storage URL directly
            final_image_url = image_url
            logger.info(f"Using Supabase Storage URL for OpenAI analysis: {image_url[:50]}...")
        elif image_data:
            # Fallback: encode to base64
            image_base64 = base64.b64encode(image_data).decode("utf-8")
            ext = filename.lower().split('.')[-1] if filename else "jpg"
            media_type = "image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}"
            final_image_url = f"data:{media_type};base64,{image_base64}"
            logger.info("Using base64 encoded image for OpenAI analysis")
        else:
            raise ValueError("Either image_url or image_data must be provided")
        
        # Optimized prompt for structured extraction
        system_prompt = """You are an expert invoice scanner. Extract product information from the invoice image.
Return ONLY valid JSON in this exact format:
{
    "items": [
        {
            "product_name": "Product name as written",
            "quantity": 10.0,
            "price": 15000.0,
            "unit": "kg"
        }
    ]
}

Rules:
- product_name: Exact name from invoice (required)
- quantity: Numeric value only (required, must be > 0)
- price: Unit price per item (required, must be >= 0)
- unit: Measurement unit (kg, dona, L, m, etc.) - default to "dona" if unclear
- Return empty items array if nothing can be read
- Do NOT include any text outside JSON
- If uncertain, make best guess but ensure all fields are present"""
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Extract all products from this {'printed' if mode == 'printed' else 'handwritten'} invoice. Return JSON only."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": final_image_url}
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1,  # Low temperature for consistent extraction
                response_format={"type": "json_object"} if mode == "printed" else None
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")
            
            # Parse JSON response
            # Handle markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            # Validate structure
            if not isinstance(result, dict):
                raise ValueError("Response is not a JSON object")
            
            # Ensure items array exists
            if "items" not in result:
                result["items"] = []
            
            # Validate each item
            validated_items = []
            for item in result.get("items", []):
                if not isinstance(item, dict):
                    continue
                
                # Required fields validation
                product_name = item.get("product_name", "").strip()
                if not product_name:
                    logger.warning(f"Skipping item with missing product_name: {item}")
                    continue
                
                try:
                    quantity = float(item.get("quantity", 0) or 0)
                    price = float(item.get("price", 0) or 0)
                    unit = str(item.get("unit", "dona")).strip() or "dona"
                    
                    if quantity <= 0:
                        logger.warning(f"Skipping item with invalid quantity: {item}")
                        continue
                    
                    validated_items.append({
                        "product_name": product_name,
                        "quantity": quantity,
                        "price": price,
                        "unit": unit
                    })
                except (ValueError, TypeError) as e:
                    logger.warning(f"Skipping item with invalid numeric values: {item}, error: {e}")
                    continue
            
            logger.info(f"Successfully extracted {len(validated_items)} items using {model}")
            return {
                "items": validated_items,
                "model_used": model,
                "mode": mode
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}, content: {content[:200]}")
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Error analyzing invoice with {model}: {e}")
            raise

# Global instance (lazy initialization to avoid errors at import time)
_hybrid_openai_instance = None

def get_hybrid_openai():
    """Get or create hybrid OpenAI client instance."""
    global _hybrid_openai_instance
    if _hybrid_openai_instance is None and settings.OPENAI_API_KEY:
        try:
            _hybrid_openai_instance = HybridOpenAIClient()
        except Exception as e:
            logger.error(f"Failed to initialize HybridOpenAIClient: {e}")
    return _hybrid_openai_instance

# For backward compatibility
hybrid_openai = None  # Will be set on first access via get_hybrid_openai()
