"""Pytest configuration and dev-database isolation guard."""
from __future__ import annotations

import os

import pytest
from dotenv import load_dotenv

load_dotenv(override=False)

from scripts.check_env import is_same_database


def pytest_configure(config: pytest.Config) -> None:
    """Enforces that tests cannot execute against the development database."""
    test_db_url = os.getenv("TEST_DATABASE_URL", "").strip()
    dev_db_url = os.getenv("DATABASE_URL", "").strip()
    direct_db_url = os.getenv("DATABASE_DIRECT_URL", "").strip()

    if not test_db_url:
        pytest.exit(
            "Refusing to run tests: TEST_DATABASE_URL is missing. Create a Neon 'test' branch and configure TEST_DATABASE_URL.",
            returncode=2,
        )

    if dev_db_url and is_same_database(dev_db_url, test_db_url):
        pytest.exit(
            "Refusing to run tests against dev DB: TEST_DATABASE_URL matches DATABASE_URL. Use a separate Neon branch.",
            returncode=2,
        )

    if direct_db_url and is_same_database(direct_db_url, test_db_url):
        pytest.exit(
            "Refusing to run tests against dev DB: TEST_DATABASE_URL matches DATABASE_DIRECT_URL. Use a separate Neon branch.",
            returncode=2,
        )

    # Override DATABASE_URL with TEST_DATABASE_URL so any app imports target test DB
    os.environ["DATABASE_URL"] = test_db_url
