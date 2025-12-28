from openai import AsyncAzureOpenAI
from app.core.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class AzureOpenAIClient:
    def __init__(self):
        self.client = AsyncAzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment_name = settings.AZURE_OPENAI_DEPLOYMENT_NAME

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Generates a JSON response from Azure OpenAI.
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
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
            logger.error(f"Error generating JSON from Azure OpenAI: {e}")
            raise e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def analyze_image(self, system_prompt: str, image_url: str) -> Dict[str, Any]:
        """
        Analyzes an image using Azure OpenAI Vision.
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
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
            # Depending on if we enforce JSON in system prompt, we might parse it.
            # GPT-4o often returns markdown json.
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
            logger.error(f"Error analyzing image with Azure OpenAI: {e}")
            raise e

# Global instance
azure_openai = AzureOpenAIClient()
