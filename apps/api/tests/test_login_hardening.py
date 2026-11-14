"""Unit and integration tests for login hardening, rate limiting, and generic error messages (B-14)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.db.models.auth import (
    LoginAttempt,
    Organization,
    Role,
    RolePermission,
    User,
    UserRole,
    UserSession,
)
from app.main import app


@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        bind=engine,
        tables=[
            Organization.__table__,
            User.__table__,
            Role.__table__,
            UserRole.__table__,
            RolePermission.__table__,
            UserSession.__table__,
            LoginAttempt.__table__,
        ],
    )
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()

    # Create test user
    u = User(
        id="user-hardening-1",
        organization_id="org-1",
        email="harden@example.com",
        hashed_password=hash_password("ValidPassword@123!"),
        first_name="Harden",
        last_name="User",
        user_type="internal",
        is_active=True,
    )
    session.add(u)
    session.commit()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        app.dependency_overrides.clear()
        session.close()


def test_generic_error_message_on_unknown_user(test_db: Session):
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "AnyPassword123!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["error"]["message"]


def test_generic_error_message_on_wrong_password(test_db: Session):
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "harden@example.com", "password": "WrongPassword123!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["error"]["message"]


def test_login_rate_limiting_after_5_failures(test_db: Session):
    client = TestClient(app)
    # 5 failed attempts
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "harden@example.com", "password": "WrongPassword123!"},
        )
        assert res.status_code == 401

    # 6th attempt should be blocked with 429
    blocked_res = client.post(
        "/api/v1/auth/login",
        json={"email": "harden@example.com", "password": "ValidPassword@123!"},
    )
    assert blocked_res.status_code == 429
    assert "Too many failed login attempts" in blocked_res.json()["error"]["message"]
