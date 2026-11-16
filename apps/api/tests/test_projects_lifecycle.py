"""Test suite for M7 Projects module: Workspaces, State Machine, Milestones, Tasks, Deliverables, Comments."""

import uuid
from datetime import UTC, datetime

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


def test_project_crud_and_state_machine(admin_client: TestClient):
    # 1. Fetch or create a client
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    if not cl:
        cl = Client(name="Acme Corp", status="active", billing_currency="INR")
        db.add(cl)
        db.commit()
        db.refresh(cl)
    client_id = cl.id
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"

    # 2. Create project
    create_res = admin_client.post(
        "/api/v1/projects",
        json={
            "client_id": client_id,
            "name": "E-Commerce Replatforming",
            "code": code,
            "priority": "high",
            "budget_paise": 50000000,
        },
    )
    assert create_res.status_code == 200, create_res.text
    project_id = create_res.json()["data"]
    assert project_id

    # 3. Verify initial state is 'planning'
    ws_res = admin_client.get(f"/api/v1/projects/{project_id}")
    assert ws_res.status_code == 200
    assert ws_res.json()["data"]["status"] == "planning"
    assert ws_res.json()["data"]["progress_percent"] == 0

    # 4. Invalid state machine transition: planning -> completed (must fail with 400)
    bad_trans = admin_client.post(
        f"/api/v1/projects/{project_id}/transition",
        json={"to_status": "completed", "reason": "Jump ahead"},
    )
    assert bad_trans.status_code == 400
    err_msg = bad_trans.json().get("detail") or bad_trans.json().get("error", {}).get("message", "")
    assert "Invalid transition" in err_msg

    # 5. Valid transition: planning -> in_progress
    trans1 = admin_client.post(
        f"/api/v1/projects/{project_id}/transition",
        json={"to_status": "in_progress", "reason": "Kickoff complete"},
    )
    assert trans1.status_code == 200
    assert trans1.json()["data"] is True

    # 6. Verify status updated
    ws_res2 = admin_client.get(f"/api/v1/projects/{project_id}")
    assert ws_res2.json()["data"]["status"] == "in_progress"


def test_project_members_management(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    # Get a staff user to add
    user_res = admin_client.get("/api/v1/users?page=1&page_size=10")
    assert user_res.status_code == 200
    users = user_res.json()["data"]["items"]
    target_user = users[0]
    dev_user_id = target_user["id"]
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"
    p_res = admin_client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "App Dev", "code": code},
    )
    project_id = p_res.json()["data"]

    # Add member
    add_res = admin_client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"user_id": dev_user_id, "project_role": "lead"},
    )
    assert add_res.status_code == 200

    # List members
    list_res = admin_client.get(f"/api/v1/projects/{project_id}/members")
    assert list_res.status_code == 200
    members = list_res.json()["data"]
    assert any(m["user_id"] == dev_user_id and m["project_role"] == "lead" for m in members)

    # Remove member
    del_res = admin_client.delete(f"/api/v1/projects/{project_id}/members/{dev_user_id}")
    assert del_res.status_code == 200

    # Verify removal
    list_res2 = admin_client.get(f"/api/v1/projects/{project_id}/members")
    assert not any(m["user_id"] == dev_user_id for m in list_res2.json()["data"])


def test_milestones_and_progress_recalculation(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"
    p_res = admin_client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Milestone Test", "code": code},
    )
    project_id = p_res.json()["data"]

    # Add 2 milestones
    m1_res = admin_client.post(
        f"/api/v1/projects/{project_id}/milestones",
        json={"title": "Design Phase", "due_date": datetime.now(UTC).date().isoformat()},
    )
    assert m1_res.status_code == 200
    m1_id = m1_res.json()["data"]

    m2_res = admin_client.post(
        f"/api/v1/projects/{project_id}/milestones",
        json={"title": "Launch Phase", "due_date": datetime.now(UTC).date().isoformat()},
    )
    assert m2_res.status_code == 200

    # Initially 0% progress
    ws = admin_client.get(f"/api/v1/projects/{project_id}").json()["data"]
    assert ws["progress_percent"] == 0

    # Mark m1 completed -> 1 of 2 units completed = 50%
    patch_res = admin_client.patch(
        f"/api/v1/projects/{project_id}/milestones/{m1_id}",
        json={"is_completed": True},
    )
    assert patch_res.status_code == 200

    ws2 = admin_client.get(f"/api/v1/projects/{project_id}").json()["data"]
    assert ws2["progress_percent"] == 50


def test_deliverable_versioning_and_approval(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"
    p_res = admin_client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Deliverables Test", "code": code},
    )
    project_id = p_res.json()["data"]

    # Upload deliverable v1
    d1_res = admin_client.post(
        f"/api/v1/projects/{project_id}/deliverables",
        json={
            "title": "Homepage Wireframes",
            "file_url": "https://storage.digitalfootprint.in/wireframes-v1.fig",
        },
    )
    assert d1_res.status_code == 200
    d1_id = d1_res.json()["data"]

    # Upload deliverable v2 (same title)
    d2_res = admin_client.post(
        f"/api/v1/projects/{project_id}/deliverables",
        json={
            "title": "Homepage Wireframes",
            "file_url": "https://storage.digitalfootprint.in/wireframes-v2.fig",
        },
    )
    assert d2_res.status_code == 200

    # Inspect workspace deliverables
    ws = admin_client.get(f"/api/v1/projects/{project_id}").json()["data"]
    delivs = ws["deliverables"]
    assert len(delivs) == 2
    assert any(d["version"] == 1 for d in delivs)
    assert any(d["version"] == 2 for d in delivs)

    # Approve deliverable v1
    rev_res = admin_client.post(
        f"/api/v1/projects/deliverables/{d1_id}/review",
        json={"status": "approved", "feedback": "Approved with no changes."},
    )
    assert rev_res.status_code == 200


def test_polymorphic_comments_and_internal_hiding(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"
    p_res = admin_client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Comments Test", "code": code},
    )
    project_id = p_res.json()["data"]

    # Staff posts public comment
    c1 = admin_client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"entity_type": "project", "entity_id": project_id, "content": "Welcome to project", "is_internal": False},
    )
    assert c1.status_code == 200

    # Staff posts internal comment
    c2 = admin_client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"entity_type": "project", "entity_id": project_id, "content": "Internal: margin is tight", "is_internal": True},
    )
    assert c2.status_code == 200

    # Staff fetches comments: sees both
    staff_comments = admin_client.get(f"/api/v1/projects/{project_id}/comments").json()["data"]
    assert len(staff_comments) == 2
    assert any(c["is_internal"] is True for c in staff_comments)
    assert any(c["is_internal"] is False for c in staff_comments)
