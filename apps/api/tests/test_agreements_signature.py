"""Test suite for M6 Service Agreements & Contracts lifecycle, e-signature, and state machine."""

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact, Contract
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def get_default_org(db) -> Organization:
    org = db.scalar(select(Organization))
    if not org:
        org = Organization(name="Digital Footprint Test Org")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org


def get_or_create_portal_user(db, email: str, client_instance: Client) -> User:
    user = db.scalar(select(User).where(User.email == email))
    org = get_default_org(db)
    if not user:
        user = User(
            organization_id=org.id,
            email=email,
            first_name="Portal",
            last_name="User",
            hashed_password=hash_password("PortalPass123!"),
            user_type="client",
            is_active=True,
        )
        db.add(user)
        db.flush()

        contact = ClientContact(
            client_id=client_instance.id,
            user_id=user.id,
            name=f"Contact {user.first_name}",
            email=email,
            is_primary=True,
        )
        db.add(contact)

        role = db.scalar(select(Role).where((Role.code == "client_owner") | (Role.name == "Client Owner")))
        if role:
            db.add(UserRole(user_id=user.id, role_id=role.id))

        db.commit()
    return user


def login_admin(client: TestClient) -> None:
    client.cookies.clear()
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"


def login_user(client: TestClient, email: str, password: str = "PortalPass123!") -> None:
    client.cookies.clear()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login as {email} failed: {res.text}"


def test_agreement_generation_and_state_machine_flow(client):
    login_admin(client)
    db = SessionLocal()
    try:
        org = get_default_org(db)
        account = db.scalar(select(Client).where(Client.name == "Agreement Test Corp"))
        if not account:
            account = Client(
                organization_id=org.id,
                name="Agreement Test Corp",
                code=f"AGRC-{uuid.uuid4().hex[:4].upper()}",
                status="active",
            )
            db.add(account)
            db.commit()
        account_id = account.id
    finally:
        db.close()

    # 1. Generate agreement
    gen_res = client.post(
        "/api/v1/agreements/generate",
        json={
            "account_id": account_id,
            "service_name": "Full-Stack SEO & Growth Retainer",
            "value_paise": 25000000,  # ₹2,50,000
            "terms_summary": "12-month retainer with monthly deliverable milestones.",
        },
    )
    assert gen_res.status_code == 200, gen_res.text
    agr_data = gen_res.json()["data"]
    agr_id = agr_data["id"]
    assert agr_data["agreement_no"].startswith("DFA-2026-")
    assert agr_data["status"] == "draft"

    # 2. State machine validation: cannot sign draft before sending
    sign_draft_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={"signer_name": "Jane Doe", "signer_title": "CEO", "consent": True},
    )
    assert sign_draft_res.status_code == 400
    assert "Agreement must be sent" in sign_draft_res.text

    # 3. Send agreement to client
    send_res = client.post(f"/api/v1/agreements/{agr_id}/send")
    assert send_res.status_code == 200, send_res.text

    # Verify sent status
    get_res = client.get(f"/api/v1/agreements/{agr_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["status"] == "sent"

    # 4. Sign agreement with e-signature details
    sign_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={
            "signer_name": "Jane Doe",
            "signer_title": "CEO",
            "consent": True,
        },
    )
    assert sign_res.status_code == 200, sign_res.text

    # Verify signed status and terms snapshot
    signed_res = client.get(f"/api/v1/agreements/{agr_id}")
    assert signed_res.status_code == 200
    data = signed_res.json()["data"]
    assert data["status"] == "signed"
    assert data["signed_copy_received"] is True
    assert "Digitally signed by Jane Doe" in (data["terms_summary"] or "")

    # 5. Re-signing already signed contract is rejected
    re_sign_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={"signer_name": "Jane Doe", "signer_title": "CEO", "consent": True},
    )
    assert re_sign_res.status_code == 400
    assert "already signed" in re_sign_res.text

    # 6. Activate agreement
    act_res = client.post(f"/api/v1/agreements/{agr_id}/activate")
    assert act_res.status_code == 200, act_res.text
    assert client.get(f"/api/v1/agreements/{agr_id}").json()["data"]["status"] == "active"

    # 7. Terminate agreement
    term_res = client.post(f"/api/v1/agreements/{agr_id}/terminate")
    assert term_res.status_code == 200, term_res.text
    assert client.get(f"/api/v1/agreements/{agr_id}").json()["data"]["status"] == "terminated"


def test_client_portal_agreement_isolation(client):
    db = SessionLocal()
    try:
        org = get_default_org(db)

        client_a = db.scalar(select(Client).where(Client.name == "Portal Agr Alpha Corp"))
        if not client_a:
            client_a = Client(
                organization_id=org.id,
                name="Portal Agr Alpha Corp",
                code=f"AGRA-{uuid.uuid4().hex[:4].upper()}",
                status="active",
            )
            db.add(client_a)
            db.flush()

        client_b = db.scalar(select(Client).where(Client.name == "Portal Agr Beta Corp"))
        if not client_b:
            client_b = Client(
                organization_id=org.id,
                name="Portal Agr Beta Corp",
                code=f"AGRB-{uuid.uuid4().hex[:4].upper()}",
                status="active",
            )
            db.add(client_b)
            db.flush()

        # Create Contract for Client A in sent status
        contract_a = db.scalar(select(Contract).where(Contract.client_id == client_a.id))
        if not contract_a:
            contract_a = Contract(
                contract_number=f"DFA-2026-{uuid.uuid4().hex[:4].upper()}",
                client_id=client_a.id,
                title="Brand Identity Overhaul",
                start_date=datetime.now(UTC).date(),
                value_paise=10000000,
                status="sent",
            )
            db.add(contract_a)
        db.commit()

        user_b = get_or_create_portal_user(db, "user_b_agr@test.in", client_b)
        db.commit()

        user_b_email = user_b.email
        contract_a_id = contract_a.id
    finally:
        db.close()

    # Portal user B attempts to sign Client A's contract
    login_user(client, user_b_email)
    cross_sign_res = client.post(
        f"/api/v1/agreements/{contract_a_id}/sign",
        json={"signer_name": "Intruder", "consent": True},
    )
    assert cross_sign_res.status_code == 403, (
        f"Expected 403 Forbidden on cross-client sign, got {cross_sign_res.status_code}"
    )
