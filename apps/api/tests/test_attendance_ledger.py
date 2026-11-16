"""Test suite for M11 HR & Attendance: Dynamic Late Thresholds, Transactional Leave Ledger, and Timesheets."""

import uuid
from datetime import UTC, datetime

import pytest
from starlette.testclient import TestClient

from app.api.v1.attendance import evaluate_attendance_status
from app.core.database import SessionLocal
from app.db.models.crm import Client
from app.db.models.hr import LeaveBalance, LeaveLedger, LeaveRequest
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


def test_dynamic_late_threshold_evaluation(admin_client: TestClient):
    # Test settings update: set working_hours_start to 09:00 with 15 min grace (late > 09:15)
    res = admin_client.patch(
        "/api/v1/settings",
        json={"working_hours_start": "09:00", "late_threshold_minutes": 15},
    )
    assert res.status_code == 200

    db = SessionLocal()
    try:
        # A punch at 09:20 AM IST on a weekday should evaluate to "late"
        # 09:20 AM IST = 03:50 AM UTC
        punch_dt = datetime(2026, 3, 2, 3, 50, 0, tzinfo=UTC)  # Monday
        out_dt = datetime(2026, 3, 2, 12, 50, 0, tzinfo=UTC)  # 9 hours later

        status, mins, missing = evaluate_attendance_status(punch_dt, out_dt, db=db)
        assert status == "late"
        assert mins == 540
        assert missing is False
    finally:
        # Reset back to standard 09:30
        admin_client.patch(
            "/api/v1/settings",
            json={"working_hours_start": "09:30", "late_threshold_minutes": 15},
        )
        db.close()


def test_leave_balances_and_transactional_debit(admin_client: TestClient):
    # 1. Fetch leave balances (auto-seeds defaults if missing)
    bal_res = admin_client.get("/api/v1/attendance/leave/balances")
    assert bal_res.status_code == 200
    balances = bal_res.json()["data"]
    assert len(balances) >= 3

    casual_bal = next(b for b in balances if b["leave_type"] == "casual")
    initial_balance = casual_bal["balance_days"]
    initial_used = casual_bal["used_days"]

    # 2. Apply for 2 days casual leave
    today_dt = datetime.now(UTC).date()
    leave_res = admin_client.post(
        "/api/v1/attendance/leave/request",
        json={
            "leave_type": "casual",
            "start_date": today_dt.isoformat(),
            "end_date": today_dt.isoformat(),
            "days_count": 2.0,
            "reason": "Family function",
        },
    )
    assert leave_res.status_code == 200
    leave_id = leave_res.json()["data"]
    assert leave_id

    # 3. Approve leave request
    rev_res = admin_client.put(
        f"/api/v1/attendance/leave/{leave_id}/review",
        json={"status": "approved"},
    )
    assert rev_res.status_code == 200

    # 4. Assert LeaveBalance is debited by exactly 2.0 days
    db = SessionLocal()
    req = db.query(LeaveRequest).filter_by(id=leave_id).first()
    assert req.status == "approved"

    bal = (
        db.query(LeaveBalance)
        .filter_by(employee_id=req.employee_id, leave_type="casual", year=today_dt.year)
        .first()
    )
    assert bal.used_days == initial_used + 2.0
    assert bal.balance_days == initial_balance - 2.0

    # 5. Assert LeaveLedger transaction recorded
    ledger = (
        db.query(LeaveLedger)
        .filter_by(reference_id=leave_id)
        .first()
    )
    assert ledger is not None
    assert ledger.transaction_type == "debit_approved_leave"
    assert ledger.days == -2.0
    assert ledger.balance_after == initial_balance - 2.0
    db.close()

    # 6. Check ledger API endpoint
    ledger_res = admin_client.get("/api/v1/attendance/leave/ledger")
    assert ledger_res.status_code == 200
    entries = ledger_res.json()["data"]
    assert any(e["reference_id"] == leave_id for e in entries)


def test_timesheets_crud(admin_client: TestClient):
    db = SessionLocal()
    cl = db.query(Client).filter_by(is_deleted=False).first()
    client_id = cl.id
    db.close()

    code = f"PRJ-{uuid.uuid4().hex[:6].upper()}"
    p_res = admin_client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Timesheet Project", "code": code},
    )
    project_id = p_res.json()["data"]

    # 1. Log timesheet
    today_dt = datetime.now(UTC).date()
    ts_res = admin_client.post(
        "/api/v1/attendance/timesheets",
        json={
            "project_id": project_id,
            "date": today_dt.isoformat(),
            "hours": 4.5,
            "description": "Implemented auth session management and audit logs",
            "is_billable": True,
        },
    )
    assert ts_res.status_code == 200
    timesheet_id = ts_res.json()["data"]
    assert timesheet_id

    # 2. List timesheets
    list_res = admin_client.get(f"/api/v1/attendance/timesheets?project_id={project_id}")
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) >= 1
    assert any(ts["id"] == timesheet_id and ts["hours"] == 4.5 for ts in items)

    # 3. Delete timesheet
    del_res = admin_client.delete(f"/api/v1/attendance/timesheets/{timesheet_id}")
    assert del_res.status_code == 200

    # 4. Verify deleted
    list_res2 = admin_client.get(f"/api/v1/attendance/timesheets?project_id={project_id}")
    assert not any(ts["id"] == timesheet_id for ts in list_res2.json()["data"])
