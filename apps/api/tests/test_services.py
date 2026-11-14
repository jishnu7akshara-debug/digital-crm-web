"""Unit and integration tests for Services Catalogue CRUD & Soft Delete (B-04)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import (
    User,
)
from app.main import app


@pytest.fixture
def service_test_client():
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
        id="admin-service-test",
        organization_id="org-1",
        email="admin@example.com",
        hashed_password=hash_password("Pass123!"),
        first_name="Admin",
        last_name="User",
        user_type="internal",
        is_super_admin=True,
    )
    session.add(admin)
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Log in as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "Pass123!"},
    )
    assert login_res.status_code == 200

    try:
        yield client, session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_services_crud_workflow(service_test_client):
    client, _session = service_test_client

    # 1. Create service
    create_payload = {
        "name": "Custom Mobile App Development",
        "code": "SRV-MOB-01",
        "category": "app",
        "description": "Full-stack React Native development",
        "pricing_type": "fixed",
        "default_price_paise": 25000000,  # ₹2,50,000
        "currency": "INR",
        "hsn_sac_code": "998314",
    }
    res = client.post("/api/v1/services", json=create_payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["name"] == "Custom Mobile App Development"
    assert data["default_price_rupees"] == 250000.0
    service_id = data["id"]

    # 2. Duplicate code rejected
    dup_res = client.post("/api/v1/services", json=create_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["error"]["message"]

    # 3. Retrieve service by ID
    get_res = client.get(f"/api/v1/services/{service_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["code"] == "SRV-MOB-01"

    # 4. Filter list by category
    list_res = client.get("/api/v1/services?category=app")
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) == 1
    assert items[0]["id"] == service_id

    # Filter with unmatched category returns empty
    other_list = client.get("/api/v1/services?category=seo")
    assert len(other_list.json()["data"]) == 0

    # 5. Update service
    update_res = client.patch(
        f"/api/v1/services/{service_id}",
        json={"name": "Enterprise Mobile App Development", "default_price_paise": 30000000},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Enterprise Mobile App Development"
    assert update_res.json()["data"]["default_price_rupees"] == 300000.0

    # 6. Soft delete service
    del_res = client.delete(f"/api/v1/services/{service_id}")
    assert del_res.status_code == 200

    # Verified excluded from active list
    after_del_list = client.get("/api/v1/services")
    assert len(after_del_list.json()["data"]) == 0
