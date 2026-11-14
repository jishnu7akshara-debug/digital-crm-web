"""Unit tests for serverless database engine and pooling configuration (B-15)."""

import os
from unittest import mock

from sqlalchemy.pool import NullPool, QueuePool

from app.core.database import get_engine_options


def test_sqlite_engine_options():
    options = get_engine_options("sqlite:///./local.db")
    assert options["connect_args"]["check_same_thread"] is False
    assert "poolclass" not in options


def test_standard_postgres_queue_pool():
    with mock.patch.dict(os.environ, {}, clear=True):
        # Ensure VERCEL and SERVERLESS are unset
        os.environ.pop("VERCEL", None)
        os.environ.pop("SERVERLESS", None)
        options = get_engine_options("postgresql+psycopg://user:pass@ep-test.neon.tech/neondb")
        assert options["poolclass"] is QueuePool
        assert "pool_size" in options
        assert options["pool_pre_ping"] is True


def test_serverless_null_pool_vercel():
    with mock.patch.dict(os.environ, {"VERCEL": "1"}):
        options = get_engine_options("postgresql+psycopg://user:pass@ep-test.neon.tech/neondb")
        assert options["poolclass"] is NullPool
        assert "pool_size" not in options
        assert options["pool_pre_ping"] is True


def test_serverless_null_pool_serverless_flag():
    with mock.patch.dict(os.environ, {"SERVERLESS": "true"}):
        options = get_engine_options("postgresql+psycopg://user:pass@ep-test.neon.tech/neondb")
        assert options["poolclass"] is NullPool
        assert "pool_size" not in options
