"""Unit and integration tests for Sequential FY Invoice Numbering & Credit Notes (B-05)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import Organization, User
from app.db.models.crm import Client
from app.main import app


@pytest.fixture
def invoices_test_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()

    # Create admin user
    admin = User(
        id="admin-inv-test",
        organization_id="org-inv-test",
        email="inv_admin@agency.com",
        hashed_password=hash_password("SuperSecret123!"),
        first_name="Inv",
        last_name="Admin",
        user_type="internal",
        is_super_admin=True,
        is_active=True,
    )
    org = Organization(id="org-inv-test", name="Inv Test Org", slug="inv-test-org")
    client = Client(
        id="cli-inv-test",
        organization_id=org.id,
        name="Peak Fitness",
        code="CLI-PEAK-001",
        status="active",
    )

    session.add_all([org, admin, client])
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)

    # Login
    res = test_client.post(
        "/api/v1/auth/login",
        json={"email": "inv_admin@agency.com", "password": "SuperSecret123!"},
    )
    assert res.status_code == 200, res.text

    try:
        yield test_client, session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_sequential_fy_invoicing_and_credit_note(invoices_test_client):
    client, _session = invoices_test_client

    # 1. Create first invoice without providing invoice_number -> auto-generates DF/YYYY-YY/0001
    res = client.post(
        "/api/v1/invoices",
        json={
            "client_id": "cli-inv-test",
            "gst_type": "intra_state",
            "line_items": [
                {
                    "description": "Website Redesign Phase 1",
                    "quantity": 1,
                    "unit_price_paise": 10000000,  # 100,000 INR
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 200, res.text
    inv1_id = res.json()["data"]

    # Verify invoice 1 number format
    res = client.get(f"/api/v1/invoices/{inv1_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "DF/" in data["invoice_number"]
    assert data["invoice_number"].endswith("/0001")
    assert data["subtotal_rupees"] == 100000.0
    assert data["tax_rupees"] == 18000.0
    assert data["total_rupees"] == 118000.0
    assert data["balance_rupees"] == 118000.0

    # 2. Create second invoice -> auto-generates /0002
    res = client.post(
        "/api/v1/invoices",
        json={
            "client_id": "cli-inv-test",
            "gst_type": "intra_state",
            "line_items": [
                {
                    "description": "SEO Monthly Retainer",
                    "quantity": 1,
                    "unit_price_paise": 3000000,
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 200
    inv2_id = res.json()["data"]

    res = client.get(f"/api/v1/invoices/{inv2_id}")
    assert res.json()["data"]["invoice_number"].endswith("/0002")

    # 3. Issue credit note against invoice 1
    # 20,000 INR = 2,000,000 paise
    res = client.post(
        f"/api/v1/invoices/{inv1_id}/credit-note",
        json={"amount_paise": 2000000, "reason": "Scope reduction discount"},
    )
    assert res.status_code == 200
    cn_id = res.json()["data"]
    assert cn_id is not None

    # Verify balance was adjusted
    res = client.get(f"/api/v1/invoices/{inv1_id}")
    data = res.json()["data"]
    assert data["balance_rupees"] == 98000.0  # 118,000 - 20,000

    # List credit notes
    res = client.get(f"/api/v1/invoices/{inv1_id}/credit-notes")
    assert res.status_code == 200
    cns = res.json()["data"]
    assert len(cns) == 1
    assert cns[0]["amount_rupees"] == 20000.0
