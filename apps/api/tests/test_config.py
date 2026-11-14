"""Unit tests for config safety validators (B-14)."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_dev_settings_valid():
    """Default development configuration loads without error."""
    s = Settings(
        APP_ENV="development",
        SECRET_KEY="dev-secret-key-digitalfootprint-change-in-production-1234567890",
        SECURE_COOKIES=False,
        DATABASE_URL="sqlite:///./test.db",
    )
    assert not s.is_production
    assert s.SQLITE_FALLBACK is False


def test_production_weak_secret_key_fails():
    """Production rejects default or short secret key."""
    with pytest.raises(ValidationError, match="cryptographically strong secret"):
        Settings(
            APP_ENV="production",
            SECRET_KEY="dev-secret-key-digitalfootprint-change-in-production-1234567890",
            SECURE_COOKIES=True,
            DATABASE_URL="postgresql+psycopg://user:pass@host/db",
        )

    with pytest.raises(ValidationError, match="cryptographically strong secret"):
        Settings(
            APP_ENV="production",
            SECRET_KEY="short-secret-key-under-64-characters",
            SECURE_COOKIES=True,
            DATABASE_URL="postgresql+psycopg://user:pass@host/db",
        )


def test_production_insecure_cookies_fails():
    """Production rejects SECURE_COOKIES=False."""
    strong_key = "a" * 64
    with pytest.raises(ValidationError, match="Production requires SECURE_COOKIES=True"):
        Settings(
            APP_ENV="production",
            SECRET_KEY=strong_key,
            SECURE_COOKIES=False,
            DATABASE_URL="postgresql+psycopg://user:pass@host/db",
        )


def test_production_sqlite_fails():
    """Production rejects SQLite database URL."""
    strong_key = "a" * 64
    with pytest.raises(ValidationError, match="Production requires a real PostgreSQL database"):
        Settings(
            APP_ENV="production",
            SECRET_KEY=strong_key,
            SECURE_COOKIES=True,
            DATABASE_URL="sqlite:///./prod.db",
        )
