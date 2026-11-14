"""Pytest configuration and dev-database isolation guard."""

from __future__ import annotations

import os

import pytest
from dotenv import load_dotenv

load_dotenv(override=False)


def pytest_configure(config: pytest.Config) -> None:
    """Enforces that tests cannot execute against SQLite or contaminate the dev schema."""
    test_db_url = os.getenv("TEST_DATABASE_URL", "").strip()

    if not test_db_url:
        pytest.exit(
            "Refusing to run tests: TEST_DATABASE_URL is missing. "
            "Configure TEST_DATABASE_URL.",
            returncode=2,
        )

    if test_db_url.startswith("sqlite"):
        pytest.exit(
            "Refusing to run tests against SQLite: per Rule R11 / Stage B protocol, tests must run against real PostgreSQL.",
            returncode=2,
        )

    # Force app settings to use TEST_DATABASE_URL
    os.environ["DATABASE_URL"] = test_db_url

    # Wire SQLAlchemy engine to automatically use test_schema
    import sqlalchemy as sa

    from app.core.database import engine

    @sa.event.listens_for(engine, "connect")
    def set_test_search_path(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("SET search_path TO test_schema, public")
        cursor.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure required seed records are present in the test database schema."""
    import app.db.models  # noqa: F401
    from app.core.database import SessionLocal, engine
    from app.core.security import hash_password
    from app.db.base import Base
    from app.db.models import (
        Client,
        Organization,
        Role,
        User,
        UserRole,
    )

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed default org
        org = db.query(Organization).first()
        if not org:
            org = Organization(id="org-default", name="Digital Footprint Solutions", slug="digital-footprint")
            db.add(org)
            db.commit()

        # Seed super admin role
        super_role = db.query(Role).filter_by(code="super_admin").first()
        if not super_role:
            super_role = Role(id="role-super-admin", organization_id=org.id, name="Super Administrator", code="super_admin")
            db.add(super_role)
            db.commit()

        # Seed admin user
        admin = db.query(User).filter_by(email="admin@digitalfootprint.in").first()
        if not admin:
            admin = User(
                id="usr-super-admin-01",
                organization_id=org.id,
                email="admin@digitalfootprint.in",
                hashed_password=hash_password("Admin@123456!"),
                first_name="Digital",
                last_name="SuperAdmin",
                user_type="internal",
                is_super_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()

            user_role = UserRole(user_id=admin.id, role_id=super_role.id)
            db.add(user_role)
            db.commit()

        # Seed Apex Global client for crm_finance test if missing
        apex = db.query(Client).filter_by(name="Apex Global Technologies").first()
        if not apex:
            from datetime import UTC, datetime

            from app.db.models.crm import ClientService, ServiceCatalogue
            from app.db.models.projects import Project

            apex = Client(
                id="cli-apex-01",
                organization_id=org.id,
                name="Apex Global Technologies",
                code="APEX",
                status="active",
                city="Bangalore",
                state="Karnataka",
            )
            db.add(apex)
            db.commit()

            # Add 4 services in catalogue and client_services
            for i in range(4):
                cat = ServiceCatalogue(
                    id=f"cat-apex-{i}",
                    name=f"Service Offering {i+1}",
                    code=f"SRV-APEX-{i}",
                    category="web",
                    default_price_paise=1000000,
                )
                db.add(cat)
                db.commit()

                db.add(ClientService(
                    id=f"svc-apex-{i}",
                    client_id=apex.id,
                    service_id=cat.id,
                    status="active",
                    price_paise=1000000,
                    billing_cycle="monthly",
                    start_date=datetime.now(UTC).date(),
                ))
            # Add project
            db.add(Project(
                id="proj-apex-01",
                client_id=apex.id,
                name="Apex Enterprise Portal",
                code="PRJ-APEX-01",
                status="in_progress",
            ))

            # Add invoice for Apex Global
            from app.db.models.finance import Invoice
            db.add(Invoice(
                id="inv-apex-01",
                invoice_number="INV-2026-0001",
                client_id=apex.id,
                issue_date=datetime.now(UTC).date(),
                due_date=datetime.now(UTC).date(),
                status="paid",
                subtotal_paise=8000000,
                cgst_paise=720000,
                sgst_paise=720000,
                total_tax_paise=1440000,
                total_paise=9440000,
                amount_paid_paise=9440000,
                balance_paise=0,
                client_name_snapshot="Apex Global Technologies",
            ))
            db.commit()
    finally:
        db.close()
