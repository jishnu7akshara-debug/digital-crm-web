"""Unit and integration tests for Sequential FY Invoice Numbering & Credit Notes (B-05)."""

import pytest
from starlette.testclient import TestClient

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


def test_sequential_fy_invoicing_and_credit_note(auth_client):
    # 1. Fetch or create a test client
    db = SessionLocal()
    try:
        client_rec = db.query(Client).filter(Client.is_deleted.is_(False)).first()
        assert client_rec is not None, "Client seed missing"
        client_id = client_rec.id
    finally:
        db.close()

    # 2. Create first invoice without providing invoice_number -> auto-generates DF/YYYY-YY/XXXX
    res1 = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": client_id,
            "line_items": [
                {
                    "description": "Website Redesign Phase 1",
                    "quantity": 1,
                    "unit_price_paise": 10000000,  # 100,000 INR
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res1.status_code == 200, res1.text
    inv1_id = res1.json()["data"]

    # Verify invoice 1 number format and amounts
    res = auth_client.get(f"/api/v1/invoices/{inv1_id}")
    assert res.status_code == 200
    data1 = res.json()["data"]
    assert "DF/" in data1["invoice_number"]
    assert data1["subtotal_rupees"] == 100000.0
    assert data1["tax_rupees"] == 18000.0
    assert data1["total_rupees"] == 118000.0
    assert data1["balance_rupees"] == 118000.0

    seq1 = int(data1["invoice_number"].split("/")[-1])

    # 3. Create second invoice -> auto-generates sequential number
    res2 = auth_client.post(
        "/api/v1/invoices",
        json={
            "client_id": client_id,
            "line_items": [
                {
                    "description": "SEO Monthly Retainer",
                    "quantity": 1,
                    "unit_price_paise": 3000000,
                    "tax_rate_percent": 18,
                }
            ],
        },
    )
    assert res2.status_code == 200, res2.text
    inv2_id = res2.json()["data"]

    res = auth_client.get(f"/api/v1/invoices/{inv2_id}")
    data2 = res.json()["data"]
    seq2 = int(data2["invoice_number"].split("/")[-1])
    assert seq2 == seq1 + 1

    # 4. Issue credit note against invoice 1
    # 20,000 INR = 2,000,000 paise
    cn_res = auth_client.post(
        f"/api/v1/invoices/{inv1_id}/credit-note",
        json={"amount_paise": 2000000, "reason": "Scope reduction discount"},
    )
    assert cn_res.status_code == 200
    cn_id = cn_res.json()["data"]
    assert cn_id is not None

    # Verify balance was adjusted
    res = auth_client.get(f"/api/v1/invoices/{inv1_id}")
    data = res.json()["data"]
    assert data["balance_rupees"] == 98000.0  # 118,000 - 20,000

    # List credit notes
    res = auth_client.get(f"/api/v1/invoices/{inv1_id}/credit-notes")
    assert res.status_code == 200
    cns = res.json()["data"]
    assert len(cns) >= 1
    assert any(c["amount_rupees"] == 20000.0 for c in cns)
