"""Test suite for M14 Reports Engine: 8 Core Business Reports and Streaming CSV Export."""

import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact
from app.main import app

REPORT_TYPES = [
    "sales-pipeline",
    "revenue",
    "receivables-ageing",
    "gst-summary",
    "project-status",
    "team-utilisation",
    "attendance-monthly",
    "support-sla",
]


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


def login_admin(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"


def test_all_8_reports_json_and_csv_export(client):
    login_admin(client)

    for r_type in REPORT_TYPES:
        # 1. Test JSON data endpoint
        json_res = client.get(f"/api/v1/reports/{r_type}")
        assert json_res.status_code == 200, f"Failed on report JSON {r_type}: {json_res.text}"
        data = json_res.json()["data"]
        assert data["report_type"] == r_type
        assert isinstance(data["headers"], list)
        assert len(data["headers"]) > 0
        assert isinstance(data["rows"], list)
        assert isinstance(data["summary"], dict)

        # 2. Test CSV export endpoint
        csv_res = client.get(f"/api/v1/reports/{r_type}/export-csv")
        assert csv_res.status_code == 200, f"Failed on report CSV {r_type}: {csv_res.text}"
        assert "text/csv" in csv_res.headers.get("content-type", "")
        assert "attachment; filename=" in csv_res.headers.get("content-disposition", "")
        # Content must contain at least the CSV header row
        csv_text = csv_res.text
        assert len(csv_text.strip()) > 0
        header_line = csv_text.strip().split("\n")[0]
        assert len(header_line) > 0


def test_invalid_report_type_returns_404(client):
    login_admin(client)
    res = client.get("/api/v1/reports/non-existent-report")
    assert res.status_code == 404
    assert "not found" in res.text.lower()


def test_client_portal_user_blocked_from_reports(client, db_session):
    # Setup client user
    org = db_session.scalar(select(Organization))
    cl = db_session.scalar(select(Client))
    assert cl is not None, "Client required for portal user test"

    user = db_session.scalar(select(User).where(User.email == "portal_reporter@test.in"))
    if not user:
        user = User(
            organization_id=org.id,
            email="portal_reporter@test.in",
            first_name="Portal",
            last_name="Reporter",
            hashed_password=hash_password("PortalPass123!"),
            user_type="client",
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()

        contact = ClientContact(
            client_id=cl.id,
            user_id=user.id,
            name="Portal Reporter",
            email="portal_reporter@test.in",
            is_primary=False,
        )
        db_session.add(contact)
        role = db_session.scalar(select(Role).where(Role.name == "client_portal_user"))
        if role:
            db_session.add(UserRole(user_id=user.id, role_id=role.id))
        db_session.commit()

    # Login as client portal user
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "portal_reporter@test.in", "password": "PortalPass123!"},
    )
    assert login_res.status_code == 200

    # Attempt to access internal reports
    res = client.get("/api/v1/reports/revenue")
    assert res.status_code == 403, f"Expected 403 Forbidden but got {res.status_code}"

    csv_res = client.get("/api/v1/reports/revenue/export-csv")
    assert csv_res.status_code == 403, f"Expected 403 Forbidden but got {csv_res.status_code}"
