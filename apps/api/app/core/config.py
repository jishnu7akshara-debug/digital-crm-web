"""Application configuration using Pydantic Settings."""

from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = "development"
    APP_NAME: str = "Digital Footprint OS"
    APP_DOMAIN: str = "crm.digitalfootprint.in"
    FRONTEND_URL: str = "http://localhost:3000"
    API_V1_PREFIX: str = "/api/v1"

    # Security & Session
    SECRET_KEY: str = "dev-secret-key-digitalfootprint-change-in-production-1234567890"
    SESSION_COOKIE_NAME: str = "df_session"
    SESSION_EXPIRE_DAYS: int = 7
    SECURE_COOKIES: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Database
    DATABASE_URL: str = "sqlite:///./digitalfootprint_os.db"
    DATABASE_DIRECT_URL: str | None = None
    SQLITE_FALLBACK: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 2
    DB_POOL_TIMEOUT: int = 30

    # Storage (S3 / Cloudflare R2 / MinIO)
    STORAGE_PROVIDER: str = "local"  # "s3" or "local"
    S3_ENDPOINT_URL: str | None = None
    S3_BUCKET_NAME: str = "df-crm-assets"
    S3_REGION: str = "auto"
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_PRESIGNED_URL_EXPIRE_SECONDS: int = 3600
    LOCAL_STORAGE_DIR: str = "./uploads"

    # Email
    EMAIL_PROVIDER: str = "console"  # "smtp", "resend", "console"
    RESEND_API_KEY: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str = "notifications@digitalfootprint.in"
    SMTP_FROM_NAME: str = "Digital Footprint OS"

    # Seed Super Admin
    SUPER_ADMIN_EMAIL: str = "admin@digitalfootprint.in"
    SUPER_ADMIN_PASSWORD: str = ""
    SUPER_ADMIN_NAME: str = "System Super Admin"

    # Timezone
    APP_TIMEZONE: str = "Asia/Kolkata"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in ("production", "prod")

    @model_validator(mode="after")
    def validate_production_safety(self) -> Self:
        if self.is_production:
            if "change-in-production" in self.SECRET_KEY or len(self.SECRET_KEY) < 64:
                raise ValueError(
                    "Production SECRET_KEY must be a cryptographically strong secret at least 64 characters long"
                )
            if not self.SECURE_COOKIES:
                raise ValueError("Production requires SECURE_COOKIES=True")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("Production requires a real PostgreSQL database, not SQLite")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [
            self.FRONTEND_URL,
            f"https://{self.APP_DOMAIN}",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]


settings = Settings()
