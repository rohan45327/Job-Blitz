from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "JobBlitz"
    DEBUG: bool = False
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"

    # Database
    DATABASE_URL: str = "postgresql://jobblitz:jobblitz_secret@localhost:5432/jobblitz_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # AI
    AI_PROVIDER: Literal["gemini", "openai", "open_source", "llama"] = "open_source"
    OPENSOURCE_MODEL_NAME: str = "llama-3.1-8b-instruct"
    OPENSOURCE_API_BASE: str = "https://api.groq.com/openai/v1"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Push
    FCM_SERVER_KEY: str = ""


settings = Settings()
