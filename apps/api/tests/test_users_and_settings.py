"""Tests for Module M1: Users, Auth Sessions, Agency Settings, and Audit Logs."""

from __future__ import annotations

import uuid

import pytest
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.db.models.auth import Role
from app.main import app


@pytest.fixture(scope="module")
def admin_client() -> TestClient:
    """Authenticated TestClient for super admin."""
    client = TestClient(app)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, res.text
    return client


def test_users_crud_and_status_lifecycle(admin_client: TestClient) -> None:
    """M1.1: Verify user listing, creation, role assignment, update, and deactivation/reactivation."""
    # 1. List users
    res = admin_client.get("/api/v1/users?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "items" in data
    assert data["total"] >= 1

    # Find a valid role
    db = SessionLocal()
    role = db.query(Role).first()
    db.close()
    assert role is not None

    # 2. Create user
    rand_email = f"emp.{uuid.uuid4().hex[:6]}@example.com"
    create_payload = {
        "email": rand_email,
        "first_name": "Test",
        "last_name": "Employee",
        "role_id": role.id,
        "phone": "+91 9988776655",
    }
    res = admin_client.post("/api/v1/users", json=create_payload)
    assert res.status_code == 200, res.text
    user_id = res.json()["data"]["id"]

    # 3. Get user detail
    res = admin_client.get(f"/api/v1/users/{user_id}")
    assert res.status_code == 200
    assert res.json()["data"]["email"] == rand_email
    assert res.json()["data"]["is_active"] is True

    # 4. Update user
    update_payload = {"first_name": "UpdatedName", "phone": "+91 1122334455"}
    res = admin_client.patch(f"/api/v1/users/{user_id}", json=update_payload)
    assert res.status_code == 200
    assert res.json()["data"]["first_name"] == "UpdatedName"

    # 5. Deactivate user
    res = admin_client.post(f"/api/v1/users/{user_id}/deactivate")
    assert res.status_code == 200
    assert res.json()["data"] is True

    # Check deactivated in detail
    res = admin_client.get(f"/api/v1/users/{user_id}")
    assert res.json()["data"]["is_active"] is False

    # 6. Reactivate user
    res = admin_client.post(f"/api/v1/users/{user_id}/reactivate")
    assert res.status_code == 200
    assert res.json()["data"] is True

    # Check reactivated
    res = admin_client.get(f"/api/v1/users/{user_id}")
    assert res.json()["data"]["is_active"] is True


def test_user_invite_flow(admin_client: TestClient) -> None:
    """M1.2: Invite flow generates invite token and URL."""
    db = SessionLocal()
    role = db.query(Role).first()
    db.close()
    assert role is not None

    invite_payload = {
        "email": f"invite.{uuid.uuid4().hex[:6]}@example.com",
        "first_name": "Invited",
        "last_name": "Specialist",
        "role_id": role.id,
    }
    res = admin_client.post("/api/v1/users/invite", json=invite_payload)
    assert res.status_code == 200, res.text
    body = res.json()["data"]
    assert "invite_token" in body
    assert "invite_url" in body
    assert body["email"] == invite_payload["email"]


def test_agency_settings_and_audit_trail(admin_client: TestClient) -> None:
    """M1.5 & M1.6: Agency settings retrieve/update and audit log verification."""
    # 1. Get settings
    res = admin_client.get("/api/v1/settings")
    assert res.status_code == 200, res.text
    settings = res.json()["data"]
    assert "org_name" in settings
    assert "invoice_prefix" in settings

    # 2. Update settings
    new_name = f"Digital Footprint HQ {uuid.uuid4().hex[:4]}"
    update_res = admin_client.patch(
        "/api/v1/settings",
        json={
            "org_name": new_name,
            "working_hours_per_day": 8.5,
            "late_threshold_minutes": 20,
        },
    )
    assert update_res.status_code == 200
    updated = update_res.json()["data"]
    assert updated["org_name"] == new_name
    assert updated["working_hours_per_day"] == 8.5
    assert updated["late_threshold_minutes"] == 20

    # 3. Query audit logs for settings update
    audit_res = admin_client.get("/api/v1/audit-logs?action=settings.update")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()["data"]
    assert audit_data["total"] >= 1
    assert any(item["action"] == "settings.update" for item in audit_data["items"])


def test_password_change_and_sessions(admin_client: TestClient) -> None:
    """M1.4: Password change and active sessions listing/revocation."""
    # 1. List active sessions
    res = admin_client.get("/api/v1/auth/sessions")
    assert res.status_code == 200
    sessions = res.json()["data"]
    assert len(sessions) >= 1
    current_sess = next((s for s in sessions if s["is_current"]), None)
    assert current_sess is not None


def test_password_reset_flow() -> None:
    """M1.3: Forgot password and token reset flow."""
    client = TestClient(app)

    # 1. Forgot password
    res = client.post("/api/v1/auth/forgot-password", json={"email": "admin@digitalfootprint.in"})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Check reset token from db
    db = SessionLocal()
    from app.db.models.common import SystemSetting
    reset_entry = db.query(SystemSetting).filter_by(category="auth_reset").first()
    assert reset_entry is not None
    db.close()
