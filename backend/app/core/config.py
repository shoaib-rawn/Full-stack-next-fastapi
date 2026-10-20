from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LedgerLite API"
    app_version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    sql_echo: bool = False
    database_url: str

    jwt_secret_key: SecretStr = Field(
        min_length=32,
    )

    jwt_algorithm: Literal["HS256"] = "HS256"

    access_token_expire_minutes: int = Field(
        default=120,
        gt=0,
    )

    refresh_token_expire_days: int = Field(
        default=7,
        gt=0,
    )

    redis_url: str = "redis://localhost:6380/0"

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
    )

    login_rate_limit_attempts: int = Field(
        default=5,
        gt=0,
    )

    login_rate_limit_window_seconds: int = Field(
        default=60,
        gt=0,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
