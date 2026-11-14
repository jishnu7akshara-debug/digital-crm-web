"""Unit and integration tests for Client 360 Full CRUD, Contacts & Service Subscriptions (B-03)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import Organization, User
from app.db.models.crm import ServiceCatalogue
from app.main import app


@pytest.fixture
def clients_test_client():
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
        id="admin-client-test",
        organization_id="org-client-test",
        email="client_admin@agency.com",
        hashed_password=hash_password("SuperSecret123!"),
        first_name="Client",
        last_name="Admin",
        user_type="internal",
        is_super_admin=True,
        is_active=True,
    )
    org = Organization(id="org-client-test", name="Client Test Org", slug="client-test-org")
    service = ServiceCatalogue(
        id="srv-web-01",
        name="Custom Web App",
        code="WEB-CUSTOM",
        category="Websites",
        default_price_paise=8000000,
        pricing_type="fixed",
    )

    session.add_all([org, admin, service])
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Login
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "client_admin@agency.com", "password": "SuperSecret123!"},
    )
    assert res.status_code == 200, res.text

    try:
        yield client, session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_client_crud_and_contacts(clients_test_client):
    client, _session = clients_test_client

    # 1. Create client
    res = client.post(
        "/api/v1/clients",
        json={
            "name": "Nova Systems Pvt Ltd",
            "code": "CLI-NOVA-999",
            "gstin": "29ABCDE1234F1Z5",
            "city": "Bengaluru",
            "state": "Karnataka",
            "primary_contact_name": "Suresh Kumar",
            "primary_contact_email": "suresh@novasystems.com",
            "primary_contact_phone": "+91 98450 12345",
        },
    )
    assert res.status_code == 200, res.text
    client_id = res.json()["data"]

    # 2. Update client details
    res = client.patch(
        f"/api/v1/clients/{client_id}",
        json={"city": "Mysuru", "website": "https://novasystems.com"},
    )
    assert res.status_code == 200

    # 3. Add secondary contact
    res = client.post(
        f"/api/v1/clients/{client_id}/contacts",
        json={
            "name": "Anita Roy",
            "email": "anita@novasystems.com",
            "designation": "Finance Head",
            "is_primary": False,
        },
    )
    assert res.status_code == 200
    contact_id = res.json()["data"]

    # 4. Subscribe client to service
    res = client.post(
        f"/api/v1/clients/{client_id}/services",
        json={
            "service_id": "srv-web-01",
            "price_paise": 8000000,
            "billing_cycle": "fixed",
            "start_date": "2026-11-01",
        },
    )
    assert res.status_code == 200
    sub_id = res.json()["data"]

    # 5. Pause subscribed service
    res = client.post(
        f"/api/v1/clients/{client_id}/services/{sub_id}/status?target_status=paused"
    )
    assert res.status_code == 200
    assert res.json()["data"] == "paused"

    # 6. Verify Client 360 endpoint returns everything
    res = client.get(f"/api/v1/clients/{client_id}")
    assert res.status_code == 200
    c360 = res.json()["data"]
    assert c360["city"] == "Mysuru"
    assert len(c360["contacts"]) == 2
    assert len(c360["services"]) == 1
    assert c360["services"][0]["status"] == "paused"

    # 7. Soft delete contact
    res = client.delete(f"/api/v1/clients/{client_id}/contacts/{contact_id}")
    assert res.status_code == 200

    # 8. Soft delete client
    res = client.delete(f"/api/v1/clients/{client_id}")
    assert res.status_code == 200

    # Check client list does not contain deleted client
    res = client.get("/api/v1/clients")
    ids = [item["id"] for item in res.json()["data"]["items"]]
    assert client_id not in ids
