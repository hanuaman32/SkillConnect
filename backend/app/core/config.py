from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings loaded from environment variables / backend/.env.

    DATABASE_URL and SECRET_KEY intentionally have no defaults: the app refuses
    to start without them, so no secret can be hardcoded in source.
    """

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "SkillConnect API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        return p if p.is_absolute() else BACKEND_DIR / p


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
