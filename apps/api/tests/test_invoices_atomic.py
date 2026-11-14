"""Tests for Atomic Document Sequences, Concurrency Safety, and Indian GST Determination (V-06)."""

from concurrent.futures import ThreadPoolExecutor

import pytest
from starlette.testclient import TestClient

from app.api.v1.invoices import get_next_sequence_value
from app.core.database import SessionLocal
from app.db.models.crm import Client
from app.main import app


@pytest.fixture(scope="module")
def auth_client():
    c = TestClient(app)
    res = c.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, res.text
    return c


@pytest.fixture(scope="module")
def setup_clients():
    """Setup or retrieve test clients for Karnataka (intra-state) and Maharashtra (inter-state)."""
    db = SessionLocal()
    try:
        from app.db.models.auth import Organization
        org = db.query(Organization).first()
        assert org is not None, "Organization seed missing"
        org_id = org.id

        # Karnataka client
        ka_client = db.query(Client).filter_by(code="CLI-TEST-KA").first()
        if not ka_client:
            ka_client = Client(
                id="cli-test-ka",
                organization_id=org_id,
                name="Karnataka Client Tech",
                code="CLI-TEST-KA",
                state="Karnataka",
                gstin="29AABCU9603R1ZM",
                status="active",
            )
            db.add(ka_client)

        # Maharashtra client
        mh_client = db.query(Client).filter_by(code="CLI-TEST-MH").first()
        if not mh_client:
            mh_client = Client(
                id="cli-test-mh",
                organization_id=org_id,
                name="Mumbai Digital Ventures",
                code="CLI-TEST-MH",
                state="Maharashtra",
                gstin="27ABCDE1234F1Z5",
                status="active",
            )
            db.add(mh_client)

        db.commit()
        return ka_client.id, mh_client.id
    finally:
        db.close()


def test_client_provided_invoice_number_rejected(auth_client, setup_clients):
    """V-06: Server must strictly reject client-provided invoice numbers with HTTP 422."""
    ka_id, _ = setup_clients

    res = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": ka_id,
            "invoice_number": "SPOOFED-INV-9999",  # Forbid extra field
            "line_items": [
                {
                    "description": "Security Penetration Test",
                    "quantity": 1,
                    "unit_price_paise": 5000000,
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 422, f"Expected 422 Unprocessable Entity, got {res.status_code}: {res.text}"


def test_gst_auto_derivation_intra_state(auth_client, setup_clients):
    """V-06: Intra-state client (Karnataka, 29) automatically derives CGST + SGST."""
    ka_id, _ = setup_clients

    res = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": ka_id,
            "line_items": [
                {
                    "description": "Cloud Hosting Management",
                    "quantity": 1,
                    "unit_price_paise": 1000000,  # ₹10,000.00
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 200, res.text
    inv_id = res.json()["data"]

    # Verify detail
    detail = auth_client.get(f"/api/v1/invoices/{inv_id}").json()["data"]
    assert detail["gst_type"] == "intra_state"
    assert detail["subtotal_rupees"] == 10000.0
    assert detail["tax_rupees"] == 1800.0
    assert detail["total_rupees"] == 11800.0


def test_gst_auto_derivation_inter_state(auth_client, setup_clients):
    """V-06: Inter-state client (Maharashtra, 27) automatically derives IGST."""
    _, mh_id = setup_clients

    res = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": mh_id,
            "line_items": [
                {
                    "description": "Cross-Border Consulting",
                    "quantity": 1,
                    "unit_price_paise": 2000000,  # ₹20,000.00
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 200, res.text
    inv_id = res.json()["data"]

    detail = auth_client.get(f"/api/v1/invoices/{inv_id}").json()["data"]
    assert detail["gst_type"] == "inter_state"
    assert detail["subtotal_rupees"] == 20000.0
    assert detail["tax_rupees"] == 3600.0
    assert detail["total_rupees"] == 23600.0


def test_conflicting_gst_type_rejected(auth_client, setup_clients):
    """V-06: If caller specifies conflicting GST type against client GSTIN/state, raise HTTP 400."""
    ka_id, _ = setup_clients

    res = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": ka_id,
            "gst_type": "inter_state",  # Conflicts with KA state!
            "line_items": [
                {
                    "description": "Disputed Tax Item",
                    "quantity": 1,
                    "unit_price_paise": 500000,
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res.status_code == 400
    body = res.json()
    error_msg = body.get("error", {}).get("message") or body.get("detail", "")
    assert "Client tax location requires 'intra_state'" in error_msg


def test_atomic_sequence_concurrency_safety():
    """V-06: Concurrent sequence generation must produce monotonic, collision-free numbers."""
    import uuid
    concurrency = 8
    target_fy = "2026-27"
    doc_type = f"test_concurrent_{uuid.uuid4().hex[:8]}"

    def fetch_sequence(_idx: int) -> int:
        db = SessionLocal()
        try:
            seq = get_next_sequence_value(
                db, document_type=doc_type, financial_year=target_fy, organization_id="test-org"
            )
            db.commit()
            return seq
        finally:
            db.close()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(fetch_sequence, i) for i in range(concurrency)]
        results = [f.result() for f in futures]

    assert len(results) == concurrency
    assert len(set(results)) == concurrency, f"Duplicates detected in concurrent sequence generation: {results}"
    results_sorted = sorted(results)
    assert results_sorted == list(range(1, concurrency + 1)), f"Gaps or non-monotonic sequence: {results_sorted}"
