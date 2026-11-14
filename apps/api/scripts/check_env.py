"""Environment verification script for Digital Footprint OS.

Validates that required environment variables are set and database endpoints are reachable.
CRITICAL: Never prints secret values, connection strings, or masked credentials.
"""
from __future__ import annotations

import argparse
import os
import ssl
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

CORE_VARS = [
    "APP_ENV",
    "APP_NAME",
    "APP_DOMAIN",
    "FRONTEND_URL",
    "API_V1_PREFIX",
    "SECRET_KEY",
    "SESSION_COOKIE_NAME",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
]


def normalize_db_identity(url_str: str) -> tuple[str, int | None, str] | None:
    """Normalizes database identity without credentials by removing -pooler from host."""
    if not url_str:
        return None
    try:
        u = make_url(url_str)
        host = (u.host or "").lower().replace("-pooler", "")
        port = u.port
        database = (u.database or "").lower()
        return (host, port, database)
    except (SQLAlchemyError, ValueError):
        return None


def is_same_database(url_a: str, url_b: str) -> bool:
    """Compares whether two connection strings target the exact same database."""
    id_a = normalize_db_identity(url_a)
    id_b = normalize_db_identity(url_b)
    if not id_a or not id_b:
        return False
    return id_a == id_b


def test_db_connection(var_name: str, url: str) -> tuple[bool, str, str | None]:
    """Tests database reachability and returns status description without leaking credentials."""
    if not url:
        return False, "MISSING", None

    try:
        u = make_url(url)
    except (SQLAlchemyError, ValueError) as e:
        return False, f"Invalid URL format ({type(e).__name__})", None

    host = (u.host or "").lower()
    db_name = u.database or ""

    # Pooler check assertions
    if var_name == "DATABASE_URL" and "-pooler" not in host:
        return False, "Host assertion failed: DATABASE_URL must contain '-pooler'", db_name

    if var_name in ("DATABASE_DIRECT_URL", "TEST_DATABASE_URL") and "-pooler" in host:
        return (
            False,
            f"Host assertion failed: {var_name} must NOT contain '-pooler' (direct unpooled required)",
            db_name,
        )

    # Test actual connection
    connect_args = {}
    if "pg8000" in url or "neon.tech" in host:
        connect_args["ssl_context"] = ssl.create_default_context()

    try:
        engine = create_engine(url, connect_args=connect_args, pool_pre_ping=True)
        with engine.connect() as conn:
            row = conn.execute(text("SELECT version(), current_database()")).fetchone()
            if not row:
                return False, "No data returned from version check", db_name
            full_version, current_db = str(row[0]), str(row[1])
            ver_part = full_version.split(",")[0].split(" on ")[0]
            return True, f"OK ({ver_part}, db={current_db})", current_db
    except (SQLAlchemyError, OSError) as exc:
        exc_type = type(exc).__name__
        hint = "check sslmode=require / pooled vs direct host"
        return False, f"{exc_type}: {hint}", db_name


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DCRM Environment Verification")
    parser.add_argument(
        "--for",
        dest="target_mode",
        choices=["app", "tests", "migrate"],
        default="all",
        help="Target subsystem verification mode",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_dotenv()

    print("=" * 65)
    print(f" Digital Footprint OS (DCRM) — Environment Verification [{args.target_mode.upper()}]")
    print("=" * 65)

    all_ok = True
    exit_code = 0

    # 1. Variable presence check
    print("\n[1/3] Checking required environment variables...")
    print(f"{'Variable':<26} | {'Status'}")
    print("-" * 40)
    for var in CORE_VARS:
        val = os.getenv(var)
        if val and val.strip():
            print(f"{var:<26} | SET")
        else:
            print(f"{var:<26} | MISSING")
            all_ok = False

    # Subsystem specific vars
    target = args.target_mode
    db_url = os.getenv("DATABASE_URL", "")
    direct_url = os.getenv("DATABASE_DIRECT_URL", "")
    test_url = os.getenv("TEST_DATABASE_URL", "")

    # 2. Database connection checks
    print("\n[2/3] Checking database connectivity (credentials hidden)...")
    if target in ("app", "all"):
        ok, msg, _ = test_db_connection("DATABASE_URL", db_url)
        print(f" - {'DATABASE_URL':<20}: {msg}")
        if not ok:
            all_ok = False

    if target in ("migrate", "all"):
        ok, msg, _ = test_db_connection("DATABASE_DIRECT_URL", direct_url)
        print(f" - {'DATABASE_DIRECT_URL':<20}: {msg}")
        if not ok:
            all_ok = False

    if target in ("tests", "all"):
        ok, msg, _ = test_db_connection("TEST_DATABASE_URL", test_url)
        print(f" - {'TEST_DATABASE_URL':<20}: {msg}")
        if not ok:
            all_ok = False

    # 3. Database separation assertion
    print("\n[3/3] Checking database branch isolation...")
    is_same = (
        (direct_url and test_url and is_same_database(direct_url, test_url))
        or (db_url and test_url and is_same_database(db_url, test_url))
    )
    comparison = "SAME" if is_same else "DIFFERENT"
    print(f" - Dev vs Test branch comparison: {comparison}")

    if comparison == "SAME" and target in ("tests", "all"):
        print("\n [ERROR] TEST_DATABASE_URL points at the dev database — refusing.")
        print("         Create a Neon 'test' branch and configure TEST_DATABASE_URL.")
        exit_code = 2
        all_ok = False
    elif not test_url and target in ("tests", "all"):
        print("\n [ERROR] TEST_DATABASE_URL is missing. Tests require an isolated database.")
        exit_code = 2
        all_ok = False

    print("\n" + "=" * 65)
    if all_ok:
        print(" Result: ALL CHECKS PASSED (exit code 0)")
        print("=" * 65)
        return 0

    if exit_code == 2:
        print(" Result: FAILED ON DATABASE ISOLATION GUARD (exit code 2)")
        print("=" * 65)
        return 2

    print(" Result: ONE OR MORE CHECKS FAILED (exit code 1)")
    print("=" * 65)
    return 1


if __name__ == "__main__":
    sys.exit(main())
