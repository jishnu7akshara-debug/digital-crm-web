"""Unit & integration tests for authentication and RBAC."""
import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "admin@digitalfootprint.in"
    assert data["data"]["is_super_admin"] is True
    assert "super_admin" in data["data"]["roles"]
    assert data["data"]["home_route"] == "/internal/dashboard"


def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["error"]["message"]


def test_unauthenticated_protected_route():
    # Make request without session cookie
    unauthed_client = TestClient(app)
    response = unauthed_client.get("/api/v1/dashboard/kpis")
    assert response.status_code == 401

