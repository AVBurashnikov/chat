"""
Configuration management for the application.
Loads settings from environment variables using pydantic-settings.
"""

from typing import List
from pydantic_settings import BaseSettings
import logging


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Database
    database_url: str = "sqlite:///./chat.db"

    # Environment
    environment: str = "development"
    debug: bool = False

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    # Rate Limiting
    rate_limit_enabled: bool = True
    login_rate_limit: str = "5/minute"

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


# Configure logging
def setup_logging():
    """Setup application logging."""
    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/security.log'),
            logging.StreamHandler()
        ]
    )


# Create loggers
security_logger = logging.getLogger("security")
app_logger = logging.getLogger("app")