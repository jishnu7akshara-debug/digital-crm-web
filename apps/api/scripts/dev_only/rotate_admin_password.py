"""Rotate Super Administrator Password safely across Neon branches.

Reads the new password from NEW_SUPER_ADMIN_PASSWORD environment variable
or prompts interactively using masked input. Never logs or prints the password.
Usage:
    python -m scripts.dev_only.rotate_admin_password [--target dev|test]
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import hash_password
from app.db.models.auth import User


def rotate_admin_password() -> None:
    parser = argparse.ArgumentParser(description="Rotate Super Admin password safely.")
    parser.add_argument(
        "--target",
        choices=["dev", "test"],
        default="dev",
        help="Database branch to rotate password in (default: dev)",
    )
    args = parser.parse_args()

    db_url_env = "DATABASE_URL" if args.target == "dev" else "TEST_DATABASE_URL"
    db_url = os.getenv(db_url_env, "").strip()

    if not db_url:
        print(f"ERROR: {db_url_env} is not set in environment.", file=sys.stderr)
        sys.exit(1)

    new_password = os.getenv("NEW_SUPER_ADMIN_PASSWORD")
    if not new_password:
        if sys.stdin.isatty():
            new_password = getpass.getpass("Enter new Super Admin password: ").strip()
            confirm = getpass.getpass("Confirm new Super Admin password: ").strip()
            if new_password != confirm:
                print("ERROR: Passwords do not match.", file=sys.stderr)
                sys.exit(1)
        else:
            print(
                "ERROR: NEW_SUPER_ADMIN_PASSWORD environment variable is required in non-interactive mode.",
                file=sys.stderr,
            )
            sys.exit(1)

    if len(new_password) < 12:
        print("ERROR: Password must be at least 12 characters long.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(db_url)
    session_factory = sessionmaker(bind=engine)
    session: Session = session_factory()

    try:
        admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@digitalfootprint.in")
        admin = session.query(User).filter_by(email=admin_email).first()

        if not admin:
            print(f"ERROR: Super admin user '{admin_email}' not found in {args.target} database.", file=sys.stderr)
            sys.exit(1)

        admin.hashed_password = hash_password(new_password)
        session.commit()
        print(f"[SUCCESS] Password for '{admin_email}' on target '{args.target}' has been rotated successfully.")
    except Exception as e:
        session.rollback()
        print(f"ERROR: Failed to update password: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    rotate_admin_password()
