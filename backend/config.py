import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hangout"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "your-super-secret-key-for-development-only"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default, override with DATABASE_URL in .env
    DATABASE_URL: str = "sqlite:///./hangout.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  
        "http://localhost:8000",  
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # SMTP for OTP emails (optional - falls back to console logging)
    SMTP_EMAIL: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
