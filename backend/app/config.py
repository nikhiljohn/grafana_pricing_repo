"""Application configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = Field(default="staging")
    log_level: str = Field(default="INFO")
    tenant_mode: str = Field(default="single")  # "single" or "multi"

    # CORS
    cors_origins: str = Field(default="http://localhost:3000")

    # Auth
    jwt_secret: str = Field(default="change-me-in-prod")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expiry_minutes: int = Field(default=60 * 24)

    # Postgres
    database_url: str = Field(
        default="postgresql+asyncpg://intellicore:intellicore_dev@localhost:5432/intellicore"
    )

    # Neo4j
    neo4j_uri: str = Field(default="bolt://localhost:7687")
    neo4j_user: str = Field(default="neo4j")
    neo4j_password: str = Field(default="intellicore_dev")
    neo4j_database: str = Field(default="neo4j")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")

    # LLM — platform default (used only as a fallback when a tenant has not
    # supplied its own key). In production customers Bring Their Own Key via
    # Settings → AI Keys, stored per-tenant and encrypted at rest.
    anthropic_api_key: str = Field(default="")
    claude_model: str = Field(default="claude-sonnet-4-5")
    openai_model: str = Field(default="gpt-4o")
    gemini_model: str = Field(default="gemini-1.5-pro")

    # Secret used to encrypt tenant-supplied API keys at rest (pgcrypto).
    # Falls back to jwt_secret when unset so a fresh deploy still works.
    credentials_secret: str = Field(default="")

    # Ingestion
    ingest_worker_interval_seconds: int = Field(default=60)
    pattern_detector_interval_seconds: int = Field(default=900)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
