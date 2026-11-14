"""Unit and integration tests for Leads Pipeline, State Machine, Activities and Soft Delete (B-01)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import (
    Organization,
    User,
)
from app.main import app


@pytest.fixture
def leads_test_client():
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
        id="admin-leads-test",
        organization_id="org-leads-test",
        email="leads_admin@agency.com",
        hashed_password=hash_password("SuperSecret123!"),
        first_name="Leads",
        last_name="Admin",
        user_type="internal",
        is_super_admin=True,
        is_active=True,
    )
    org = Organization(id="org-leads-test", name="Leads Test Org", slug="leads-test-org")
    session.add_all([org, admin])
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Login to acquire session
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "leads_admin@agency.com", "password": "SuperSecret123!"},
    )
    assert res.status_code == 200, res.text

    try:
        yield client, session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_leads_state_machine_and_activities(leads_test_client):
    client, _session = leads_test_client

    # 1. Create a lead
    res = client.post(
        "/api/v1/leads",
        json={
            "title": "FinTech Mobile App",
            "company_name": "Apex Finance",
            "contact_name": "Rahul Verma",
            "email": "rahul@apexfin.com",
            "phone": "+91 9876543210",
            "source": "referral",
            "status": "new",
            "estimated_value_paise": 50000000,
            "notes": "Interested in iOS and Android native apps.",
        },
    )
    assert res.status_code == 200
    lead_id = res.json()["data"]

    # 2. Get lead detail
    res = client.get(f"/api/v1/leads/{lead_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["company_name"] == "Apex Finance"
    assert data["status"] == "new"
    assert data["estimated_value_rupees"] == 500000.0

    # 3. Invalid stage transition (new directly to won should fail)
    res = client.post(f"/api/v1/leads/{lead_id}/stage", json={"stage": "won"})
    assert res.status_code == 400
    assert "Invalid transition" in res.json()["error"]["message"]

    # 4. Valid stage transitions: new -> contacted -> qualified -> proposal_sent -> negotiation
    for next_stage in ["contacted", "qualified", "proposal_sent", "negotiation"]:
        res = client.post(f"/api/v1/leads/{lead_id}/stage", json={"stage": next_stage})
        assert res.status_code == 200, res.text
        assert res.json()["data"] == next_stage

    # 5. Add an activity / note
    res = client.post(
        f"/api/v1/leads/{lead_id}/activities",
        json={
            "activity_type": "call",
            "notes": "Discussed timeline and budget with Rahul. Sent preliminary scope document.",
        },
    )
    assert res.status_code == 200
    act_id = res.json()["data"]
    assert act_id is not None

    # 6. List activities
    res = client.get(f"/api/v1/leads/{lead_id}/activities")
    assert res.status_code == 200
    activities = res.json()["data"]
    # Should include automatic stage changes + explicit call activity
    assert len(activities) >= 5

    # 7. Convert lead to client
    res = client.post(
        f"/api/v1/leads/{lead_id}/convert",
        json={
            "client_code": "APEX-001",
            "city": "Bengaluru",
            "state": "Karnataka",
        },
    )
    assert res.status_code == 200
    client_id = res.json()["data"]
    assert client_id is not None

    # Check lead is marked won
    res = client.get(f"/api/v1/leads/{lead_id}")
    assert res.json()["data"]["status"] == "won"
    assert res.json()["data"]["converted_client_id"] == client_id

    # 8. Soft delete lead
    res = client.delete(f"/api/v1/leads/{lead_id}")
    assert res.status_code == 200

    # Should not appear in list_leads
    res = client.get("/api/v1/leads")
    lead_ids = [item["id"] for item in res.json()["data"]["items"]]
    assert lead_id not in lead_ids
