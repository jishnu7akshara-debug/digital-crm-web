"""Tests for M12 File Asset Management and Storage Service."""

import io
import uuid

import pytest
from sqlalchemy import select
from starlette.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact
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

        # Link contact
        contact = ClientContact(
            client_id=client_instance.id,
            user_id=user.id,
            name=f"Contact {user.first_name}",
            email=email,
            is_primary=True,
        )
        db.add(contact)

        # Role
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


def test_file_upload_and_download(client, db_session):
    login_admin(client)

    # 1. Upload valid PDF document
    pdf_content = b"%PDF-1.4 test file content for storage verification"
    files = {
        "file": ("test_doc.pdf", io.BytesIO(pdf_content), "application/pdf"),
    }
    data = {
        "entity_type": "contract",
        "entity_id": "test-contract-001",
    }
    upload_res = client.post("/api/v1/files/upload", data=data, files=files)
    assert upload_res.status_code == 201, upload_res.text
    file_data = upload_res.json()["data"]
    file_id = file_data["id"]
    storage_key = file_data["storage_key"]
    assert file_data["original_filename"] == "test_doc.pdf"
    assert file_data["mime_type"] == "application/pdf"
    assert file_data["size_bytes"] == len(pdf_content)

    # 2. Get file URL
    url_res = client.get(f"/api/v1/files/{file_id}/url")
    assert url_res.status_code == 200, url_res.text
    assert url_res.json()["data"]["url"] == f"/api/v1/files/download/{storage_key}"

    # 3. Download file content
    dl_res = client.get(f"/api/v1/files/download/{storage_key}")
    assert dl_res.status_code == 200, dl_res.text
    assert dl_res.content == pdf_content
    assert dl_res.headers["content-type"] == "application/pdf"
    assert 'attachment; filename="test_doc.pdf"' in dl_res.headers["content-disposition"]


def test_dangerous_and_disallowed_file_types_rejected(client):
    login_admin(client)

    # Dangerous extension .exe
    exe_files = {
        "file": ("malware.exe", io.BytesIO(b"MZ\x90\x00\x03"), "application/x-msdownload"),
    }
    res_exe = client.post("/api/v1/files/upload", files=exe_files)
    assert res_exe.status_code == 400
    assert "prohibited" in res_exe.text

    # Disallowed MIME type
    bad_mime_files = {
        "file": ("script.py", io.BytesIO(b"print('hack')"), "text/x-python"),
    }
    res_bad = client.post("/api/v1/files/upload", files=bad_mime_files)
    assert res_bad.status_code == 400


def test_scoped_file_access_isolation(client, db_session):
    org = get_default_org(db_session)

    # Find or create two separate clients
    client_a = db_session.scalar(select(Client).where(Client.name == "Client Alpha Test"))
    if not client_a:
        client_a = Client(
            organization_id=org.id,
            name="Client Alpha Test",
            code=f"ALPH-{uuid.uuid4().hex[:4].upper()}",
            status="active",
        )
        db_session.add(client_a)
        db_session.flush()

    client_b = db_session.scalar(select(Client).where(Client.name == "Client Beta Test"))
    if not client_b:
        client_b = Client(
            organization_id=org.id,
            name="Client Beta Test",
            code=f"BETA-{uuid.uuid4().hex[:4].upper()}",
            status="active",
        )
        db_session.add(client_b)
        db_session.flush()

    db_session.commit()

    user_a = get_or_create_portal_user(db_session, "alpha_user@portal-test.in", client_a)
    user_b = get_or_create_portal_user(db_session, "beta_user@portal-test.in", client_b)

    # User A uploads a file scoped to Client A
    login_user(client, user_a.email)
    doc_content = b"Confidential business data of Client Alpha"
    files = {
        "file": ("client_alpha_data.txt", io.BytesIO(doc_content), "text/plain"),
    }
    data = {
        "entity_type": "client",
        "entity_id": client_a.id,
    }
    upload_res = client.post("/api/v1/files/upload", data=data, files=files)
    assert upload_res.status_code == 201, upload_res.text
    file_id = upload_res.json()["data"]["id"]
    storage_key = upload_res.json()["data"]["storage_key"]

    # User A can get URL and download
    assert client.get(f"/api/v1/files/{file_id}/url").status_code == 200
    assert client.get(f"/api/v1/files/download/{storage_key}").status_code == 200

    # User B logs in and attempts to access User A's file
    login_user(client, user_b.email)
    url_res_b = client.get(f"/api/v1/files/{file_id}/url")
    assert url_res_b.status_code == 403, f"Expected 403 Forbidden but got {url_res_b.status_code}"

    dl_res_b = client.get(f"/api/v1/files/download/{storage_key}")
    assert dl_res_b.status_code == 403, f"Expected 403 Forbidden but got {dl_res_b.status_code}"

    # Clean up file
    login_user(client, user_a.email)
    del_res = client.delete(f"/api/v1/files/{file_id}")
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/files/{file_id}").status_code == 404
