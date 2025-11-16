"""Core configuration settings."""
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    
    # LLM Configuration
    llm_provider: str = "openai"  # "openai" or "local"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    
    # Local LLM Configuration (for Ollama, LM Studio, etc.)
    local_llm_base_url: str = "http://localhost:11434/v1"  # Ollama default
    local_llm_model: str = "llama2"  # or "mistral", "llama3", etc.
    local_llm_api_key: Optional[str] = None  # Usually not needed for local
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    
    # Assessment Thresholds
    initial_phq9_threshold: int = 10
    initial_gad7_threshold: int = 10
    risk_confidence_threshold: float = 0.7
    
    # Session Configuration
    passive_monitoring_sessions: int = 3
    checkpoint_interval_days: int = 30
    
    # C-SSRS Configuration
    cssrs_high_risk_score: int = 3
    cssrs_urgent_score: int = 1
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

