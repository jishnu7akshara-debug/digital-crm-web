"""Test suite for M6 Service Agreements & Contracts lifecycle, e-signature, and state machine."""

import uuid

import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact, Contract
from app.main import app


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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

        role = db.scalar(select(Role).where(Role.name == "client_portal_user"))
        if role:
            db.add(UserRole(user_id=user.id, role_id=role.id))

        db.commit()
        db.refresh(user)
    return user


def login_admin(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@digitalfootprint.in", "password": "Admin@123456!"},
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"


def login_user(client: TestClient, email: str, password: str = "PortalPass123!") -> None:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login as {email} failed: {res.text}"


def test_agreement_generation_and_state_machine_flow(client, db_session):
    login_admin(client)
    org = get_default_org(db_session)

    # 1. Create or get target client
    account = db_session.scalar(select(Client).where(Client.name == "Agreement Test Corp"))
    if not account:
        account = Client(
            organization_id=org.id,
            name="Agreement Test Corp",
            code=f"AGRC-{uuid.uuid4().hex[:4].upper()}",
            status="active",
        )
        db_session.add(account)
        db_session.commit()
        db_session.refresh(account)

    # 2. Generate agreement
    gen_res = client.post(
        "/api/v1/agreements/generate",
        json={
            "account_id": account.id,
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

    # 3. State machine validation: cannot sign draft before sending
    sign_draft_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={"signer_name": "Jane Doe", "signer_title": "CEO", "consent": True},
    )
    assert sign_draft_res.status_code == 400
    assert "Agreement must be sent" in sign_draft_res.text

    # 4. Send agreement to client
    send_res = client.post(f"/api/v1/agreements/{agr_id}/send")
    assert send_res.status_code == 200, send_res.text

    # Verify sent status
    get_res = client.get(f"/api/v1/agreements/{agr_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["status"] == "sent"

    # 5. Sign agreement with e-signature details
    sign_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={
            "signer_name": "Jane Doe",
            "signer_title": "Chief Executive Officer",
            "consent": True,
        },
    )
    assert sign_res.status_code == 200, sign_res.text

    # Verify signed status & digital stamp
    signed_contract = db_session.get(Contract, agr_id)
    assert signed_contract.status == "signed"
    assert signed_contract.signed_copy_received is True
    assert "Digitally signed by Jane Doe" in signed_contract.terms_summary

    # 6. Re-signing already signed contract is rejected
    re_sign_res = client.post(
        f"/api/v1/agreements/{agr_id}/sign",
        json={"signer_name": "Jane Doe", "signer_title": "CEO", "consent": True},
    )
    assert re_sign_res.status_code == 400
    assert "already signed" in re_sign_res.text

    # 7. Activate agreement
    act_res = client.post(f"/api/v1/agreements/{agr_id}/activate")
    assert act_res.status_code == 200, act_res.text
    db_session.refresh(signed_contract)
    assert signed_contract.status == "active"

    # 8. Terminate agreement
    term_res = client.post(f"/api/v1/agreements/{agr_id}/terminate")
    assert term_res.status_code == 200, term_res.text
    db_session.refresh(signed_contract)
    assert signed_contract.status == "terminated"


def test_client_portal_agreement_isolation(client, db_session):
    org = get_default_org(db_session)

    # Client A and Client B
    client_a = db_session.scalar(select(Client).where(Client.name == "Portal Agr Alpha Corp"))
    if not client_a:
        client_a = Client(
            organization_id=org.id,
            name="Portal Agr Alpha Corp",
            code=f"AGRA-{uuid.uuid4().hex[:4].upper()}",
            status="active",
        )
        db_session.add(client_a)
        db_session.flush()

    client_b = db_session.scalar(select(Client).where(Client.name == "Portal Agr Beta Corp"))
    if not client_b:
        client_b = Client(
            organization_id=org.id,
            name="Portal Agr Beta Corp",
            code=f"AGRB-{uuid.uuid4().hex[:4].upper()}",
            status="active",
        )
        db_session.add(client_b)
        db_session.flush()

    # Create Contract for Client A in sent status
    contract_a = Contract(
        contract_number=f"DFA-2026-{uuid.uuid4().hex[:4].upper()}",
        client_id=client_a.id,
        title="Brand Identity Overhaul",
        start_date=db_session.scalar(select(Client)).created_at.date(),
        value_paise=10000000,
        status="sent",
    )
    db_session.add(contract_a)
    db_session.commit()
    db_session.refresh(contract_a)

    user_b = get_or_create_portal_user(db_session, "user_b_agr@test.in", client_b)

    # Portal user B attempts to sign Client A's contract
    login_user(client, user_b.email)
    cross_sign_res = client.post(
        f"/api/v1/agreements/{contract_a.id}/sign",
        json={"signer_name": "Intruder", "consent": True},
    )
    assert cross_sign_res.status_code == 403, (
        f"Expected 403 Forbidden on cross-client sign, got {cross_sign_res.status_code}"
    )
