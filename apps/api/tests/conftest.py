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

    dev_url = os.getenv("DATABASE_URL", "").strip()
    dev_direct = os.getenv("DATABASE_DIRECT_URL", "").strip()
    from scripts.check_env import is_same_database

    if is_same_database(test_db_url, dev_url) or (dev_direct and is_same_database(test_db_url, dev_direct)):
        pytest.exit(
            "Refusing to run tests: TEST_DATABASE_URL targets the dev database! "
            "Tests must run in an isolated test database to protect dev data.",
            returncode=2,
        )

    # Force app settings to use TEST_DATABASE_URL and unpooled NullPool for concurrency safety
    os.environ["DATABASE_URL"] = test_db_url
    os.environ["DATABASE_DIRECT_URL"] = test_db_url
    os.environ["ALEMBIC_DATABASE_URL"] = test_db_url
    os.environ["SERVERLESS"] = "1"


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure migrations are applied and required seed records are present in the test database."""
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

    db = SessionLocal()
    try:
        org = db.query(Organization).first()
    except Exception:
        org = None
        Base.metadata.create_all(bind=engine)

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

        # Seed all permissions and system & portal roles for test harness
        from seed import PERMISSIONS_DEF, ROLE_MATRIX, PORTAL_ROLES
        from app.db.models import Permission, RolePermission

        existing_perms = {p.code: p for p in db.query(Permission).all()}
        for code, module, name, desc in PERMISSIONS_DEF:
            if code not in existing_perms:
                perm = Permission(code=code, module=module, name=name, description=desc)
                db.add(perm)
                existing_perms[code] = perm
        db.commit()

        permissions_by_module = {}
        for p in db.query(Permission).all():
            permissions_by_module.setdefault(p.module, []).append(p)

        existing_roles = {r.code: r for r in db.query(Role).all()}
        for role_code, matrix in ROLE_MATRIX.items():
            if role_code not in existing_roles:
                role_type = "client" if role_code in PORTAL_ROLES else "internal"
                role_name = role_code.replace("_", " ").title()
                role = Role(
                    organization_id=org.id,
                    name=role_name,
                    code=role_code,
                    description=PORTAL_ROLES.get(role_code, f"System {role_name} role"),
                    is_system=True,
                    role_type=role_type,
                )
                db.add(role)
                existing_roles[role_code] = role
        db.commit()

        existing_rps = set(db.query(RolePermission.role_id, RolePermission.permission_id).all())
        to_add_rps = []
        for role_code, matrix in ROLE_MATRIX.items():
            role = existing_roles.get(role_code)
            if not role:
                continue
            for module, scope in matrix.items():
                if scope and module in permissions_by_module:
                    for perm in permissions_by_module[module]:
                        if (role.id, perm.id) not in existing_rps:
                            to_add_rps.append(RolePermission(role_id=role.id, permission_id=perm.id, scope=scope))
                            existing_rps.add((role.id, perm.id))
        if to_add_rps:
            db.add_all(to_add_rps)
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


@pytest.fixture
def db_session():
    """Provides an isolated database session wrapped in a transaction rolled back at teardown.
    Uses join_transaction_mode='create_savepoint' so commits inside endpoints only release savepoints.
    """
    from sqlalchemy.orm import Session

    from app.core.database import engine

    connection = engine.connect()
    trans = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    yield session

    session.close()
    trans.rollback()
    connection.close()


@pytest.fixture
def test_client(db_session):
    """FastAPI TestClient with get_db overridden to use the per-test rollback session."""
    from starlette.testclient import TestClient

    from app.core.database import get_db
    from app.main import app

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

