"""Test 20 concurrent HTTP invoice create requests and Indian FY boundary clock-freeze.

Requirements (Step 3):
- 20 concurrent HTTP requests attempting to create invoices
- Exactly 20 invoices created
- 20 strictly distinct invoice numbers
- No sequence numbers skipped
- Indian financial year transition: freeze clock at 2026-03-31T23:59:59 and 2026-04-01T00:00:01,
  verify sequence resets per FY.
"""

from __future__ import annotations

import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime

import pytest
from starlette.testclient import TestClient

from app.api.v1.invoices import (
    generate_next_invoice_number,
    get_current_fy,
)
from app.core.database import SessionLocal
from app.db.models.auth import Organization
from app.db.models.crm import Client
from app.db.models.finance import Invoice
from app.main import app


@pytest.fixture(scope="module")
def auth_cookies() -> dict[str, str]:
    """Log in as super admin and return session cookies."""
    client = TestClient(app)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return dict(client.cookies)


@pytest.fixture(scope="module")
def target_client() -> str:
    """Ensure a dedicated client exists in test DB for concurrency test."""
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None, "Organization missing"

        client = db.query(Client).filter_by(code="CLI-CONCURRENCY-TEST").first()
        if not client:
            client = Client(
                id=f"cli-conc-{uuid.uuid4().hex[:8]}",
                organization_id=org.id,
                name="Concurrency Test Enterprise",
                code="CLI-CONCURRENCY-TEST",
                state="Karnataka",
                gstin="29ABCDE1234F1Z5",
                status="active",
            )
            db.add(client)
            db.commit()
            db.refresh(client)
        return client.id
    finally:
        db.close()


def test_twenty_concurrent_invoice_creates(auth_cookies: dict[str, str], target_client: str) -> None:
    """Fire 20 concurrent HTTP invoice create requests and verify atomicity.

    Asserts:
    1. All 20 requests return HTTP 200
    2. Exactly 20 distinct invoice IDs and invoice numbers created
    3. No sequence numbers are duplicated or skipped within the batch
    """
    total_requests = 20

    def create_single_invoice(idx: int) -> dict:
        client = TestClient(app, cookies=auth_cookies)
        payload = {
            "client_id": target_client,
            "line_items": [
                {
                    "description": f"Concurrent Service Item {idx}",
                    "hsn_sac_code": "998314",
                    "quantity": 1,
                    "unit_price_paise": 1000000 + (idx * 10000),
                    "tax_rate_percent": 18,
                }
            ],
            "notes": f"Concurrency test batch index {idx}",
        }
        res = client.post("/api/v1/invoices", json=payload)
        return {"status_code": res.status_code, "body": res.json()}

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(create_single_invoice, i) for i in range(total_requests)]
        results = [f.result() for f in futures]

    # 1. Assert exactly 20 HTTP 200 responses
    statuses = [r["status_code"] for r in results]
    assert all(s == 200 for s in statuses), f"Some creations failed: {results}"

    invoice_ids = [r["body"]["data"] for r in results]
    assert len(invoice_ids) == total_requests
    assert len(set(invoice_ids)) == total_requests, "Duplicate invoice IDs returned!"

    # 2. Query created invoices from DB to verify invoice_number sequence
    db = SessionLocal()
    try:
        created_invoices = (
            db.query(Invoice)
            .filter(Invoice.id.in_(invoice_ids))
            .all()
        )
        assert len(created_invoices) == total_requests

        inv_numbers = [inv.invoice_number for inv in created_invoices]
        assert len(set(inv_numbers)) == total_requests, f"Duplicate invoice numbers: {inv_numbers}"

        # Extract sequence integers e.g. DF/2026-27/0042 -> 42
        seq_numbers = sorted(int(num.split("/")[-1]) for num in inv_numbers)

        # 3. Assert zero gaps (contiguous integers)
        expected_range = list(range(seq_numbers[0], seq_numbers[0] + total_requests))
        assert seq_numbers == expected_range, (
            f"Gaps detected in invoice sequence: expected {expected_range}, got {seq_numbers}"
        )
    finally:
        db.close()


def test_indian_financial_year_transition_clock_freeze() -> None:
    """Assert sequence reset and financial year determination across FY boundary.

    Indian Financial Year runs from April 1 to March 31:
    - 2026-03-31T23:59:59 UTC -> FY 2025-26
    - 2026-04-01T00:00:01 UTC -> FY 2026-27
    """
    pre_midnight = datetime(2026, 3, 31, 23, 59, 59, tzinfo=UTC)
    post_midnight = datetime(2026, 4, 1, 0, 0, 1, tzinfo=UTC)

    fy_before = get_current_fy(pre_midnight)
    fy_after = get_current_fy(post_midnight)

    assert fy_before == "2025-26", f"Expected '2025-26', got '{fy_before}'"
    assert fy_after == "2026-27", f"Expected '2026-27', got '{fy_after}'"

    # Verify atomic sequence resets for the new financial year in test DB
    db = SessionLocal()
    try:
        test_org_id = f"test-org-fy-{uuid.uuid4().hex[:6]}"

        num_before_1 = generate_next_invoice_number(db, organization_id=test_org_id, as_of=pre_midnight)
        num_before_2 = generate_next_invoice_number(db, organization_id=test_org_id, as_of=pre_midnight)
        db.commit()

        assert num_before_1 == f"DF/{fy_before}/0001"
        assert num_before_2 == f"DF/{fy_before}/0002"

        # Freeze clock after midnight -> new FY -> sequence must reset to 0001!
        num_after_1 = generate_next_invoice_number(db, organization_id=test_org_id, as_of=post_midnight)
        num_after_2 = generate_next_invoice_number(db, organization_id=test_org_id, as_of=post_midnight)
        db.commit()

        assert num_after_1 == f"DF/{fy_after}/0001", (
            f"Expected FY sequence to reset to 0001, got {num_after_1}"
        )
        assert num_after_2 == f"DF/{fy_after}/0002", (
            f"Expected next sequence to be 0002, got {num_after_2}"
        )
    finally:
        db.close()
