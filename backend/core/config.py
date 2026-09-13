"""
Application configuration via pydantic-settings.
All values are read from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///./forensiq.db"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "forensiq_neo4j"

    # LLM
    LLM_PROVIDER: str = "mock"  # mock | openai | ollama | gemini | anthropic
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # App
    SECRET_KEY: str = "change_me"
    UPLOAD_DIR: str = "./uploads"
    REPORTS_DIR: str = "./reports"
    MAX_UPLOAD_SIZE_MB: int = 100


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
