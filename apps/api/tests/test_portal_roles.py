"""Test suite for M15 Client Portal RBAC Roles Matrix.

Verifies strict least-privilege matrix across 4 portal client roles:
- Client Owner: Full client visibility (invoices, projects, tickets, agreements)
- Client Manager: Projects, tickets, agreements (Strictly blocked from Invoices: 403)
- Client Finance: Invoices, agreements (Strictly blocked from Projects & Tickets: 403)
- Client Employee: Projects, tickets (Strictly blocked from Invoices & Agreements: 403)
"""

import uuid

import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def get_default_org(db) -> Organization:
    org = db.scalar(select(Organization))
    if not org:
        org = Organization(name="Digital Footprint Test Org")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org


def get_or_create_portal_user_with_role(
    db, email: str, role_code: str, client_instance: Client
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    org = get_default_org(db)
    if not user:
        user = User(
            organization_id=org.id,
            email=email,
            first_name=role_code.replace("client_", "").title(),
            last_name="Tester",
            hashed_password=hash_password("PortalRolePass123!"),
            user_type="client",
            is_active=True,
        )
        db.add(user)
        db.flush()

        contact = ClientContact(
            client_id=client_instance.id,
            user_id=user.id,
            name=f"Contact {user.first_name}",
            email=email,
            is_primary=True,
        )
        db.add(contact)

        # Lookup role by code or name
        role = db.scalar(select(Role).where((Role.code == role_code) | (Role.name == role_code)))
        assert role is not None, f"Role matching '{role_code}' must exist in seeded DB"
        db.add(UserRole(user_id=user.id, role_id=role.id))

        db.commit()
        db.refresh(user)
    return user


def login_portal(client: TestClient, email: str) -> None:
    client.cookies.clear()
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "PortalRolePass123!"},
    )
    assert res.status_code == 200, f"Login as {email} failed: {res.text}"


@pytest.fixture(scope="module")
def portal_test_users():
    db = SessionLocal()
    try:
        org = get_default_org(db)

        # Dedicated client company for RBAC matrix testing
        test_client_account = db.scalar(
            select(Client).where(Client.name == "Portal RBAC Matrix Corp")
        )
        if not test_client_account:
            test_client_account = Client(
                organization_id=org.id,
                name="Portal RBAC Matrix Corp",
                code=f"RBAC-{uuid.uuid4().hex[:4].upper()}",
                status="active",
            )
            db.add(test_client_account)
            db.commit()
            db.refresh(test_client_account)

        owner_user = get_or_create_portal_user_with_role(
            db, "portal_owner@rbac-test.in", "client_owner", test_client_account
        )
        manager_user = get_or_create_portal_user_with_role(
            db, "portal_manager@rbac-test.in", "client_manager", test_client_account
        )
        finance_user = get_or_create_portal_user_with_role(
            db, "portal_finance@rbac-test.in", "client_finance", test_client_account
        )
        employee_user = get_or_create_portal_user_with_role(
            db, "portal_employee@rbac-test.in", "client_employee", test_client_account
        )
        return {
            "owner": owner_user.email,
            "manager": manager_user.email,
            "finance": finance_user.email,
            "employee": employee_user.email,
        }
    finally:
        db.close()


def test_client_owner_full_access(client, portal_test_users):
    """Client Owner has full visibility across invoices, projects, tickets, and agreements."""
    login_portal(client, portal_test_users["owner"])
    assert client.get("/api/v1/invoices").status_code == 200
    assert client.get("/api/v1/projects").status_code == 200
    assert client.get("/api/v1/support/tickets").status_code == 200
    assert client.get("/api/v1/agreements").status_code == 200


def test_client_manager_least_privilege(client, portal_test_users):
    """Client Manager can access projects, tickets, agreements; strictly forbidden (403) from invoices."""
    login_portal(client, portal_test_users["manager"])
    assert client.get("/api/v1/projects").status_code == 200
    assert client.get("/api/v1/support/tickets").status_code == 200
    assert client.get("/api/v1/agreements").status_code == 200

    inv_res = client.get("/api/v1/invoices")
    assert inv_res.status_code == 403, (
        f"Client Manager must be forbidden from invoices, got {inv_res.status_code}"
    )


def test_client_finance_least_privilege(client, portal_test_users):
    """Client Finance can access invoices, agreements; strictly forbidden (403) from projects and tickets."""
    login_portal(client, portal_test_users["finance"])
    assert client.get("/api/v1/invoices").status_code == 200
    assert client.get("/api/v1/agreements").status_code == 200

    proj_res = client.get("/api/v1/projects")
    assert proj_res.status_code == 403, (
        f"Client Finance must be forbidden from projects, got {proj_res.status_code}"
    )

    tkt_res = client.get("/api/v1/support/tickets")
    assert tkt_res.status_code == 403, (
        f"Client Finance must be forbidden from support tickets, got {tkt_res.status_code}"
    )


def test_client_employee_least_privilege(client, portal_test_users):
    """Client Employee can access projects and tickets; strictly forbidden (403) from invoices and agreements."""
    login_portal(client, portal_test_users["employee"])
    assert client.get("/api/v1/projects").status_code == 200
    assert client.get("/api/v1/support/tickets").status_code == 200

    emp_inv_res = client.get("/api/v1/invoices")
    assert emp_inv_res.status_code == 403, (
        f"Client Employee must be forbidden from invoices, got {emp_inv_res.status_code}"
    )

    emp_agr_res = client.get("/api/v1/agreements")
    assert emp_agr_res.status_code == 403, (
        f"Client Employee must be forbidden from agreements, got {emp_agr_res.status_code}"
    )
