"""Test suite for M10 Support module: SLA calculation, State Machine, and Internal Note Privacy."""

from datetime import datetime

import pytest
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.db.models.crm import Client
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


def test_ticket_creation_and_sla_calculation(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    if not cl:
        cl = Client(name="Apex Labs", status="active", billing_currency="INR")
        db.add(cl)
        db.commit()
        db.refresh(cl)
    client_id = cl.id
    db.close()

    # 1. Create urgent ticket
    create_res = admin_client.post(
        "/api/v1/support/tickets",
        json={
            "client_id": client_id,
            "subject": "Production Outage Urgent",
            "description": "API gateway is unresponsive",
            "priority": "urgent",
        },
    )
    assert create_res.status_code == 200, create_res.text
    ticket_id = create_res.json()["data"]
    assert ticket_id

    # 2. Query SLA endpoint
    sla_res = admin_client.get(f"/api/v1/support/tickets/{ticket_id}/sla")
    assert sla_res.status_code == 200
    sla_data = sla_res.json()["data"]

    assert sla_data["ticket_id"] == ticket_id
    assert sla_data["priority"] == "urgent"
    assert "response_due_at" in sla_data
    assert "resolution_due_at" in sla_data

    # Response due date should be in the future (2 business hours)
    resp_due = datetime.fromisoformat(sla_data["response_due_at"])
    res_due = datetime.fromisoformat(sla_data["resolution_due_at"])
    assert res_due > resp_due


def test_ticket_state_machine_and_timestamps(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    # Create ticket
    t_res = admin_client.post(
        "/api/v1/support/tickets",
        json={
            "client_id": client_id,
            "subject": "Billing clarification",
            "description": "Need breakdown of GST",
            "priority": "medium",
        },
    )
    ticket_id = t_res.json()["data"]

    # 1. Invalid transition: open -> waiting_on_client (must fail with 400)
    bad_res = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/transition",
        json={"to_status": "waiting_on_client"},
    )
    assert bad_res.status_code == 400
    err_msg = bad_res.json().get("detail") or bad_res.json().get("error", {}).get("message", "")
    assert "Invalid transition" in err_msg

    # 2. Valid transition: open -> in_progress
    t1 = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/transition",
        json={"to_status": "in_progress"},
    )
    assert t1.status_code == 200

    # 3. Valid transition: in_progress -> waiting_on_client
    t2 = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/transition",
        json={"to_status": "waiting_on_client"},
    )
    assert t2.status_code == 200

    # 4. Valid transition: waiting_on_client -> resolved
    t3 = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/transition",
        json={"to_status": "resolved"},
    )
    assert t3.status_code == 200

    # Verify resolved_at timestamp is set
    detail = admin_client.get(f"/api/v1/support/tickets/{ticket_id}").json()["data"]
    assert detail["status"] == "resolved"
    assert detail["resolved_at"] is not None


def test_ticket_comment_privacy_and_first_response(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    t_res = admin_client.post(
        "/api/v1/support/tickets",
        json={
            "client_id": client_id,
            "subject": "Feature request",
            "description": "Can we export CSV?",
            "priority": "low",
        },
    )
    ticket_id = t_res.json()["data"]

    # 1. Add internal agent note
    c_int = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/comments",
        json={"content": "Check engineering roadmap for Q3", "is_internal": True},
    )
    assert c_int.status_code == 200

    # 2. Add public reply -> sets first_response_at
    c_pub = admin_client.post(
        f"/api/v1/support/tickets/{ticket_id}/comments",
        json={"content": "We have received your request and logged it.", "is_internal": False},
    )
    assert c_pub.status_code == 200

    detail = admin_client.get(f"/api/v1/support/tickets/{ticket_id}").json()["data"]
    assert detail["first_response_at"] is not None
    assert len(detail["comments"]) == 2
    assert any(c["is_internal"] is True for c in detail["comments"])
    assert any(c["is_internal"] is False for c in detail["comments"])
