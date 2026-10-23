from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LedgerLite API"
    app_version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    sql_echo: bool = False
    database_url: str
    database_url_unpooled: str | None = None

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

    @field_validator(
        "database_url",
        "database_url_unpooled",
        mode="before",
    )
    @classmethod
    def normalize_postgres_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        normalized = value
        if normalized.startswith("postgresql://"):
            normalized = normalized.replace(
                "postgresql://",
                "postgresql+asyncpg://",
                1,
            )
        elif normalized.startswith("postgres://"):
            normalized = normalized.replace(
                "postgres://",
                "postgresql+asyncpg://",
                1,
            )

        # Neon emits libpq-style options. asyncpg does not accept
        # channel_binding and expects the TLS keyword to be named `ssl`.
        parts = urlsplit(normalized)
        query = urlencode(
            [
                ("ssl" if key == "sslmode" else key, item)
                for key, item in parse_qsl(parts.query, keep_blank_values=True)
                if key != "channel_binding"
            ],
        )
        return urlunsplit(
            (parts.scheme, parts.netloc, parts.path, query, parts.fragment),
        )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
