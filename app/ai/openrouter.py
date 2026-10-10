import httpx
import logging
import json
import os
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None, model_pool: Optional[List[str]] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model_pool = model_pool or settings.FREE_MODEL_POOL

    async def chat_completion_with_fallback(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
        response_format: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Calls OpenRouter using free models in sequence.
        If a model is rate-limited (429), unavailable (503/500), or times out,
        it automatically fails over to the next free model in the pool.
        """
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY is not set. Falling back to local heuristic response.")
            return {"content": None, "model": "local_fallback", "error": "no_api_key"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://topbox-support.local",
            "X-Title": "TOPBOX SUPPORT OS",
            "Content-Type": "application/json"
        }

        last_error = None
        for model_name in self.model_pool:
            logger.info(f"Attempting OpenRouter request using model: {model_name}")
            payload: Dict[str, Any] = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            if response_format:
                payload["response_format"] = response_format

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        json=payload,
                        headers=headers
                    )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"Successfully received response from {model_name}")
                    return {
                        "content": content,
                        "model": model_name,
                        "usage": data.get("usage", {}),
                        "error": None
                    }
                elif response.status_code in [429, 500, 502, 503, 504]:
                    logger.warning(
                        f"Model {model_name} failed with status {response.status_code}: {response.text[:200]}. Falling back to next model..."
                    )
                    last_error = f"Status {response.status_code} from {model_name}"
                    continue
                else:
                    logger.warning(f"Unexpected status {response.status_code} from {model_name}: {response.text[:200]}")
                    last_error = f"Status {response.status_code}"
                    continue
            except httpx.TimeoutException:
                logger.warning(f"Timeout connecting to OpenRouter with {model_name}. Trying next...")
                last_error = f"Timeout with {model_name}"
                continue
            except Exception as e:
                logger.warning(f"Exception calling OpenRouter with {model_name}: {e}. Trying next...")
                last_error = str(e)
                continue

        logger.error(f"All free models in pool exhausted. Last error: {last_error}")
        return {
            "content": None,
            "model": "pool_exhausted",
            "error": last_error or "All free models in pool failed"
        }

openrouter_client = OpenRouterClient()
