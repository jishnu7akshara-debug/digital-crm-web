"""Unit tests for check_env database isolation logic.

Tests the URL comparison logic without requiring a live database connection.
"""
from scripts.check_env import is_same_database, normalize_db_identity


def test_normalize_db_identity_strips_pooler():
    url_pooled = "postgresql+psycopg://user:pass@ep-sweet-river-12345-pooler.us-east-2.aws.neon.tech:5432/neondb"
    url_direct = "postgresql+psycopg://user:pass@ep-sweet-river-12345.us-east-2.aws.neon.tech:5432/neondb"

    id_pooled = normalize_db_identity(url_pooled)
    id_direct = normalize_db_identity(url_direct)

    assert id_pooled is not None
    assert id_direct is not None
    assert id_pooled == id_direct
    assert id_pooled[0] == "ep-sweet-river-12345.us-east-2.aws.neon.tech"
    assert id_pooled[1] == 5432
    assert id_pooled[2] == "neondb"


def test_is_same_database_detects_pooled_and_direct_match():
    url_pooled = "postgresql+psycopg://user:pass@ep-sweet-river-12345-pooler.us-east-2.aws.neon.tech/neondb"
    url_direct = "postgresql+psycopg://user:pass@ep-sweet-river-12345.us-east-2.aws.neon.tech/neondb"

    assert is_same_database(url_pooled, url_direct) is True


def test_is_same_database_detects_different_branches():
    url_dev = "postgresql+psycopg://user:pass@ep-sweet-river-12345.us-east-2.aws.neon.tech/neondb"
    url_test = "postgresql+psycopg://user:pass@ep-cool-mountain-67890.us-east-2.aws.neon.tech/neondb"

    assert is_same_database(url_dev, url_test) is False


def test_is_same_database_handles_empty_or_invalid():
    assert is_same_database("", "postgresql://localhost/db") is False
    assert is_same_database("not-a-valid-url", "postgresql://localhost/db") is False
    assert is_same_database("", "") is False
