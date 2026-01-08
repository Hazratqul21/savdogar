"""
Direct OpenAI Client (replaces Azure OpenAI)
Uses OpenAI API directly with gpt-4o model
"""
from openai import AsyncOpenAI
from app.core.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class OpenAIClient:
    """Direct OpenAI client using OpenAI API (not Azure)"""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be set in environment variables")
        
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        )
        self.model = "gpt-4o"  # Use gpt-4o model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Generates a JSON response from OpenAI.
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error generating JSON from OpenAI: {e}")
            raise e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """
        Generates a text response from OpenAI.
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Error generating text from OpenAI: {e}")
            raise e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def analyze_image(self, system_prompt: str, image_url: str) -> Dict[str, Any]:
        """
        Analyzes an image using OpenAI Vision (gpt-4o).
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user", 
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1
            )
            # Parse JSON from response
            content = response.choices[0].message.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If not JSON, return struct with raw text
                return {"raw_analysis": content}

        except Exception as e:
            logger.error(f"Error analyzing image with OpenAI: {e}")
            raise e

# Global instance
openai_client = OpenAIClient()
