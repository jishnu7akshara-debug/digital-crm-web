"""Database connection engine and session factory for SQLAlchemy 2.x."""

import os
import ssl
from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import settings


def get_engine_options(database_url: str) -> dict[str, Any]:
    """Computes engine parameters and pooling strategy based on environment and database URL."""
    connect_args: dict[str, Any] = {}
    options: dict[str, Any] = {"echo": False}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        options["connect_args"] = connect_args
        return options

    # PostgreSQL / Neon / Supabase
    if "pg8000" in database_url or "neon.tech" in database_url:
        connect_args["ssl_context"] = ssl.create_default_context()
    if connect_args:
        options["connect_args"] = connect_args

    options["pool_pre_ping"] = True

    # Serverless runtime detection (Vercel, AWS Lambda, or explicit SERVERLESS=1)
    is_serverless = bool(os.getenv("VERCEL")) or os.getenv("SERVERLESS", "").strip().lower() in (
        "1",
        "true",
    )

    if is_serverless:
        options["poolclass"] = NullPool
    else:
        options["poolclass"] = QueuePool
        options["pool_size"] = settings.DB_POOL_SIZE
        options["max_overflow"] = settings.DB_MAX_OVERFLOW
        options["pool_timeout"] = settings.DB_POOL_TIMEOUT
        options["pool_recycle"] = 300

    return options


engine_options = get_engine_options(settings.DATABASE_URL)
engine = create_engine(settings.DATABASE_URL, **engine_options)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
