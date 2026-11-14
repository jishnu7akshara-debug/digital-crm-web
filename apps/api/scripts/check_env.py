"""Environment verification script for Digital Footprint OS.

Validates that required environment variables are set and database endpoints are reachable.
CRITICAL: Never prints secret values, connection strings, or masked credentials.
"""
import os
import sys
import ssl
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

REQUIRED_VARS = [
    "APP_ENV",
    "APP_NAME",
    "APP_DOMAIN",
    "FRONTEND_URL",
    "API_V1_PREFIX",
    "SECRET_KEY",
    "SESSION_COOKIE_NAME",
    "DATABASE_URL",
    "DATABASE_DIRECT_URL",
    "TEST_DATABASE_URL",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
]


def test_db_connection(var_name: str, url: str) -> tuple[bool, str, str | None]:
    """Tests database reachability and returns status description without leaking credentials."""
    if not url:
        return False, "MISSING", None

    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL format ({type(e).__name__})", None

    host = parsed.hostname or ""
    db_name = parsed.path.lstrip("/")

    # Pooler check assertions
    if var_name == "DATABASE_URL" and "-pooler" not in host:
        return False, "Host assertion failed: DATABASE_URL must contain '-pooler'", db_name

    if var_name in ("DATABASE_DIRECT_URL", "TEST_DATABASE_URL") and "-pooler" in host:
        return False, f"Host assertion failed: {var_name} must NOT contain '-pooler' (direct unpooled required)", db_name

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
            # Shorten version to PostgreSQL X.Y
            ver_part = full_version.split(",")[0].split(" on ")[0]
            return True, f"OK ({ver_part}, db={current_db})", current_db
    except Exception as exc:
        exc_type = type(exc).__name__
        hint = "check sslmode=require / pooled vs direct host"
        return False, f"{exc_type}: {hint}", db_name


def main() -> int:
    load_dotenv()
    print("=" * 65)
    print(" Digital Footprint OS (DCRM) — Environment Verification")
    print("=" * 65)

    all_ok = True

    # 1. Variable presence check
    print("\n[1/3] Checking required environment variables...")
    print(f"{'Variable':<26} | {'Status'}")
    print("-" * 40)
    for var in REQUIRED_VARS:
        val = os.getenv(var)
        if val and val.strip():
            print(f"{var:<26} | SET")
        else:
            print(f"{var:<26} | MISSING")
            all_ok = False

    # 2. Database connection checks
    print("\n[2/3] Checking database connectivity (credentials hidden)...")
    dev_db_name = None
    test_db_name = None

    db_vars = ["DATABASE_URL", "DATABASE_DIRECT_URL", "TEST_DATABASE_URL"]
    for var in db_vars:
        url = os.getenv(var, "")
        ok, msg, current_db = test_db_connection(var, url)
        print(f" - {var:<20}: {msg}")
        if not ok:
            all_ok = False
        if var == "DATABASE_DIRECT_URL":
            dev_db_name = current_db
        elif var == "TEST_DATABASE_URL":
            test_db_name = current_db

    # 3. Database separation assertion
    print("\n[3/3] Checking database branch isolation...")
    if dev_db_name and test_db_name:
        if dev_db_name == test_db_name and os.getenv("DATABASE_DIRECT_URL") == os.getenv("TEST_DATABASE_URL"):
            print(" ⚠️  WARNING: DATABASE_DIRECT_URL and TEST_DATABASE_URL point to the SAME database.")
            print("     Running the test suite will wipe or overwrite development data!")
            print("     Ensure your Neon project has a dedicated 'test' branch.")
        else:
            print(" [OK] Dev and Test databases are isolated.")

    print("\n" + "=" * 65)
    if all_ok:
        print(" Result: ALL CHECKS PASSED (exit code 0)")
        print("=" * 65)
        return 0
    else:
        print(" Result: ONE OR MORE CHECKS FAILED (exit code 1)")
        print("=" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(main())
