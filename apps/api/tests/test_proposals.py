"""Unit and integration tests for Proposals & Opportunities API (B-02, F-02)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import Organization, User
from app.db.models.crm import Client, Lead
from app.main import app


@pytest.fixture
def proposals_test_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()

    # Create admin user & test entities
    admin = User(
        id="admin-prop-test",
        organization_id="org-prop-test",
        email="prop_admin@agency.com",
        hashed_password=hash_password("SuperSecret123!"),
        first_name="Prop",
        last_name="Admin",
        user_type="internal",
        is_super_admin=True,
        is_active=True,
    )
    org = Organization(id="org-prop-test", name="Prop Test Org", slug="prop-test-org")
    client = Client(
        id="cli-prop-test",
        organization_id=org.id,
        name="Apex Client",
        code="CLI-APEX-001",
        status="active",
    )
    lead = Lead(
        id="lead-prop-test",
        organization_id=org.id,
        title="CRM Project Lead",
        contact_name="Rohan",
        email="rohan@lead.com",
        status="qualified",
    )

    session.add_all([org, admin, client, lead])
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)

    # Login to acquire session
    res = test_client.post(
        "/api/v1/auth/login",
        json={"email": "prop_admin@agency.com", "password": "SuperSecret123!"},
    )
    assert res.status_code == 200, res.text

    try:
        yield test_client, session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_proposal_lifecycle_and_calculations(proposals_test_client):
    client, _session = proposals_test_client

    # 1. Create a proposal with line items
    # Item 1: 1 x 100,000 INR = 10,000,000 paise
    # Item 2: 2 x 50,000 INR = 10,000,000 paise
    # Subtotal: 20,000,000 paise (200,000 INR)
    # Discount: 1,000,000 paise (10,000 INR) -> Net Subtotal: 19,000,000 paise
    # 18% GST: 3,420,000 paise (34,200 INR)
    # Total: 22,420,000 paise (224,200 INR)
    res = client.post(
        "/api/v1/proposals",
        json={
            "title": "Full Stack Platform Proposal",
            "client_id": "cli-prop-test",
            "line_items": [
                {
                    "description": "Custom Next.js Frontend Architecture",
                    "quantity": 1,
                    "unit_price_paise": 10000000,
                },
                {
                    "description": "FastAPI & PostgreSQL Backend Microservices",
                    "quantity": 2,
                    "unit_price_paise": 5000000,
                },
            ],
            "discount_paise": 1000000,
            "tax_rate_percent": 18.0,
            "terms_and_conditions": "50% advance, 50% on UAT sign-off.",
        },
    )
    assert res.status_code == 200, res.text
    prop_id = res.json()["data"]

    # 2. Get proposal detail and verify calculations
    res = client.get(f"/api/v1/proposals/{prop_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["title"] == "Full Stack Platform Proposal"
    assert data["client_name"] == "Apex Client"
    assert data["status"] == "draft"
    assert data["subtotal_rupees"] == 200000.0
    assert data["discount_rupees"] == 10000.0
    assert data["tax_rupees"] == 34200.0
    assert data["total_rupees"] == 224200.0
    assert len(data["line_items"]) == 2

    # 3. Transition proposal status to 'sent'
    res = client.post(f"/api/v1/proposals/{prop_id}/status?target_status=sent")
    assert res.status_code == 200
    assert res.json()["data"] == "sent"

    # 4. Accept proposal
    res = client.post(f"/api/v1/proposals/{prop_id}/status?target_status=accepted")
    assert res.status_code == 200
    assert res.json()["data"] == "accepted"

    # Verify accepted_at timestamp was stamped
    res = client.get(f"/api/v1/proposals/{prop_id}")
    assert res.json()["data"]["accepted_at"] is not None

    # 5. List proposals
    res = client.get("/api/v1/proposals?client_id=cli-prop-test")
    assert res.status_code == 200
    assert res.json()["data"]["total"] >= 1

    # 6. Soft delete proposal
    res = client.delete(f"/api/v1/proposals/{prop_id}")
    assert res.status_code == 200

    # Ensure proposal is filtered out
    res = client.get("/api/v1/proposals")
    ids = [item["id"] for item in res.json()["data"]["items"]]
    assert prop_id not in ids
