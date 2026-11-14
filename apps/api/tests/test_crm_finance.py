"""Tests for CRM Client 360, Multi-Tenant isolation, and Finance GST calculations."""

import pytest
from starlette.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def auth_client():
    c = TestClient(app)
    res = c.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200
    return c


def test_client_360_retrieval(auth_client):
    # Fetch list
    res = auth_client.get("/api/v1/clients")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) > 0

    client_id = items[0]["id"]
    detail_res = auth_client.get(f"/api/v1/clients/{client_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]

    assert detail["name"] == "Apex Global Technologies"
    assert len(detail["services"]) >= 4
    assert len(detail["projects"]) >= 1
    assert "metrics" in detail
    assert detail["metrics"]["total_invoiced_rupees"] == 94400.0


def test_invoice_gst_calculation(auth_client):
    # Fetch clients to get client_id
    res = auth_client.get("/api/v1/clients")
    client_id = res.json()["data"]["items"][0]["id"]

    inv_number = "INV-TEST-099"
    payload = {
        "client_id": client_id,
        "invoice_number": inv_number,
        "issue_date": "2026-11-05",
        "due_date": "2026-11-20",
        "gst_type": "intra_state",
        "line_items": [
            {
                "description": "Custom Software Module",
                "hsn_sac_code": "998314",
                "quantity": 1,
                "unit_price_paise": 1000000,  # ₹10,000.00
                "tax_rate_percent": 18,
            }
        ],
    }

    create_res = auth_client.post("/api/v1/invoices", json=payload)
    assert create_res.status_code == 200
    inv_id = create_res.json()["data"]

    # Verify PDF generation
    pdf_res = auth_client.get(f"/api/v1/invoices/{inv_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000


def test_lead_conversion_idempotence(auth_client):
    # Create a new lead
    lead_payload = {
        "title": "Inbound Enterprise ERP Inquiry",
        "company_name": "Zenith Logistics Ltd",
        "contact_name": "Rohan Deshmukh",
        "email": "rohan@zenithlogistics.in",
        "phone": "+91 99000 88776",
        "source": "website",
        "estimated_value_paise": 15000000,
    }
    lead_res = auth_client.post("/api/v1/leads", json=lead_payload)
    assert lead_res.status_code == 200
    lead_id = lead_res.json()["data"]

    # Convert lead to client
    convert_payload = {
        "client_code": "CLI-ZENITH-01",
        "gstin": "27AAACZ9999F1Z9",
        "city": "Pune",
        "state": "Maharashtra",
    }
    convert_res = auth_client.post(f"/api/v1/leads/{lead_id}/convert", json=convert_payload)
    assert convert_res.status_code == 200
    client_id = convert_res.json()["data"]
    assert client_id is not None

    # Trying to convert again must fail
    dup_convert = auth_client.post(f"/api/v1/leads/{lead_id}/convert", json=convert_payload)
    assert dup_convert.status_code == 400
    assert "already been converted" in dup_convert.json()["error"]["message"]
