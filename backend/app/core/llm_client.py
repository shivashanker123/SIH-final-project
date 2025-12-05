"""LLM client wrapper supporting both OpenAI and local LLMs."""
from typing import Optional
from openai import AsyncOpenAI
from app.core.config import settings
import structlog
import httpx

logger = structlog.get_logger()


class LLMClient:
    """Wrapper for LLM API calls supporting OpenAI and local LLMs."""
    
    def __init__(self, provider: str = "openai", api_key: Optional[str] = None, 
                 base_url: Optional[str] = None, model: Optional[str] = None):
        self.provider = provider
        self.model = model or (settings.local_llm_model if provider == "local" else settings.openai_model)
        
        if provider == "openai":
            # Use OpenAI API
            if not api_key and not settings.openai_api_key:
                raise ValueError("OpenAI API key required when using OpenAI provider")
            self.client = AsyncOpenAI(
                api_key=api_key or settings.openai_api_key,
                base_url=base_url  # Allows custom endpoints
            )
        elif provider == "local":
            # Use local LLM (Ollama, LM Studio, etc.)
            base_url = base_url or settings.local_llm_base_url
            api_key = api_key or settings.local_llm_api_key
            self.client = AsyncOpenAI(
                api_key=api_key or "ollama",  # Ollama doesn't need real key, but some clients require it
                base_url=base_url
            )
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
    
    async def generate(self, prompt: str, max_tokens: int = 500, system_message: str = None) -> str:
        """Generate response from LLM."""
        try:
            system_content = system_message or "You are a helpful assistant."
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            
            if not result:
                logger.warning("llm_returned_empty_response", provider=self.provider, model=self.model)
                return "I apologize, but I couldn't generate a response. Please try again."
            
            return result
            
        except httpx.ConnectError as e:
            logger.error("llm_connection_error", 
                        provider=self.provider, 
                        base_url=self.client.base_url,
                        error=str(e))
            raise ConnectionError(
                f"Could not connect to LLM at {self.client.base_url}. "
                f"Make sure your local LLM server is running. "
                f"For Ollama, run: ollama serve"
            )
        except Exception as e:
            logger.error("llm_generation_error", 
                        provider=self.provider, 
                        model=self.model,
                        error=str(e))
            raise


_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get LLM client instance based on configuration."""
    global _llm_client
    if _llm_client is None:
        provider = settings.llm_provider.lower()
        
        if provider == "openai":
            if not settings.openai_api_key:
                raise ValueError(
                    "OpenAI API key not set. Set OPENAI_API_KEY in .env file, "
                    "or set LLM_PROVIDER=local to use a local LLM."
                )
            _llm_client = LLMClient(
                provider="openai",
                api_key=settings.openai_api_key,
                model=settings.openai_model
            )
        elif provider == "local":
            _llm_client = LLMClient(
                provider="local",
                base_url=settings.local_llm_base_url,
                model=settings.local_llm_model
            )
            logger.info("using_local_llm", 
                       base_url=settings.local_llm_base_url,
                       model=settings.local_llm_model)
        else:
            raise ValueError(
                f"Unknown LLM provider: {provider}. "
                f"Set LLM_PROVIDER to 'openai' or 'local' in .env file."
            )
    
    return _llm_client


