"""Idempotently create QA users for automated testing and route sweep.

Guard: This script may ONLY execute when APP_ENV in ("development", "dev", "local", "test").
Credentials: Uses QA_USER_PASSWORD environment variable or default fallback.
Creates both @example.test and @example.com accounts to satisfy both naming spec
and Pydantic EmailStr validation without modifying app source code during Gate 0.
"""

import os
import sys

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models import (
    Client,
    ClientContact,
    Organization,
    Role,
    User,
    UserRole,
)


def create_qa_users() -> None:
    """Create or update qa.sales and qa.client accounts idempotently."""
    app_env = os.getenv("APP_ENV", settings.APP_ENV).lower()
    if app_env not in ("development", "dev", "local", "test"):
        print(f"ERROR: Refusing to create QA users in '{app_env}' environment.", file=sys.stderr)
        sys.exit(1)

    qa_password = os.getenv("QA_USER_PASSWORD", "QaTest@12345!")
    hashed_pwd = hash_password(qa_password)

    db: Session = SessionLocal()
    try:
        org = db.query(Organization).first()
        if not org:
            org = Organization(name="Digital Footprint Solutions", slug="digital-footprint")
            db.add(org)
            db.commit()
            db.refresh(org)

        # 1. QA Sales Role
        sales_role = db.query(Role).filter_by(code="sales").first()
        if not sales_role:
            print("ERROR: 'sales' role not found in database. Run seed first.", file=sys.stderr)
            sys.exit(1)

        for sales_email in ("qa.sales@example.test", "qa.sales@example.com"):
            qa_sales = db.query(User).filter_by(email=sales_email).first()
            if not qa_sales:
                qa_sales = User(
                    organization_id=org.id,
                    email=sales_email,
                    hashed_password=hashed_pwd,
                    first_name="QA",
                    last_name="Sales",
                    user_type="internal",
                    is_active=True,
                    is_suspended=False,
                )
                db.add(qa_sales)
                db.commit()
                db.refresh(qa_sales)
                print(f"[OK] Created user: {sales_email}")
            else:
                qa_sales.hashed_password = hashed_pwd
                qa_sales.is_active = True
                qa_sales.is_suspended = False
                db.commit()
                print(f"[OK] Updated user: {sales_email}")

            ur_sales = (
                db.query(UserRole).filter_by(user_id=qa_sales.id, role_id=sales_role.id).first()
            )
            if not ur_sales:
                db.add(UserRole(user_id=qa_sales.id, role_id=sales_role.id))
                db.commit()
                print(f"[OK] Assigned role 'sales' to {sales_email}")

        # 2. QA Client Role
        client_role = db.query(Role).filter_by(code="client_owner").first()
        if not client_role:
            print(
                "ERROR: 'client_owner' role not found in database. Run seed first.", file=sys.stderr
            )
            sys.exit(1)

        primary_client = db.query(Client).first()
        if not primary_client:
            print("ERROR: No Client record found in database. Run seed first.", file=sys.stderr)
            sys.exit(1)

        for client_email in ("qa.client@example.test", "qa.client@example.com"):
            qa_client = db.query(User).filter_by(email=client_email).first()
            if not qa_client:
                qa_client = User(
                    organization_id=org.id,
                    email=client_email,
                    hashed_password=hashed_pwd,
                    first_name="QA",
                    last_name="Client",
                    user_type="client",
                    is_active=True,
                    is_suspended=False,
                )
                db.add(qa_client)
                db.commit()
                db.refresh(qa_client)
                print(f"[OK] Created user: {client_email}")
            else:
                qa_client.hashed_password = hashed_pwd
                qa_client.is_active = True
                qa_client.is_suspended = False
                db.commit()
                print(f"[OK] Updated user: {client_email}")

            ur_client = (
                db.query(UserRole).filter_by(user_id=qa_client.id, role_id=client_role.id).first()
            )
            if not ur_client:
                db.add(UserRole(user_id=qa_client.id, role_id=client_role.id))
                db.commit()
                print(f"[OK] Assigned role 'client_owner' to {client_email}")

            contact = db.query(ClientContact).filter_by(email=client_email).first()
            if not contact:
                contact = ClientContact(
                    client_id=primary_client.id,
                    user_id=qa_client.id,
                    name=f"QA Contact ({client_email})",
                    email=client_email,
                    phone="+91 99999 00000",
                    designation="QA Lead",
                    is_primary=False,
                )
                db.add(contact)
                db.commit()
                print(f"[OK] Linked {client_email} to client '{primary_client.name}'")
            else:
                contact.user_id = qa_client.id
                contact.client_id = primary_client.id
                db.commit()
                print(f"[OK] Verified link for {client_email} to client '{primary_client.name}'")

        print("QA users creation completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    create_qa_users()
