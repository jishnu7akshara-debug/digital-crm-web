"""Unit and integration tests for atomic audit logging and transactions (B-13)."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.audit import log_audit_event
from app.core.tx import transactional
from app.db.base import Base
from app.db.models.common import AuditLog
from app.db.models.crm import Lead


@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine, tables=[Lead.__table__, AuditLog.__table__])
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_audit_log_does_not_commit_independently(memory_db: Session):
    """Verify that log_audit_event leaves transaction open until explicit commit."""
    log_audit_event(
        db=memory_db,
        action="test.action",
        resource_type="lead",
        resource_id="test-lead-1",
    )
    # Roll back session
    memory_db.rollback()

    # The audit log entry should NOT exist in the database because it was rolled back
    logs = memory_db.query(AuditLog).all()
    assert len(logs) == 0


def test_transactional_context_manager_commits_on_success(memory_db: Session):
    """Verify that transactional context manager commits both entity and audit log on success."""
    with transactional(memory_db):
        lead = Lead(
            organization_id="org-1",
            title="Enterprise Cloud Solution",
            company_name="Cloud Corp",
            contact_name="Alice",
            email="alice@cloudcorp.example.com",
            phone="+919876543210",
            source="website",
            status="new",
            estimated_value_paise=5000000,
        )
        memory_db.add(lead)
        memory_db.flush()
        log_audit_event(
            db=memory_db,
            action="lead.create",
            resource_type="lead",
            resource_id=lead.id,
            new_values={"title": lead.title},
        )

    # Verify both are committed
    saved_lead = memory_db.query(Lead).filter_by(title="Enterprise Cloud Solution").first()
    assert saved_lead is not None

    saved_log = memory_db.query(AuditLog).filter_by(resource_id=saved_lead.id).first()
    assert saved_log is not None
    assert saved_log.action == "lead.create"


def test_transactional_context_manager_rolls_back_on_failure(memory_db: Session):
    """Verify that transactional context manager rolls back both entity and audit log on error."""
    with pytest.raises(RuntimeError, match="Simulated crash"), transactional(memory_db):
        lead = Lead(
            organization_id="org-1",
            title="Failed Deal",
            company_name="Doomed Inc",
            contact_name="Bob",
            email="bob@doomed.example.com",
            phone="+919876543210",
            source="website",
            status="new",
            estimated_value_paise=1000000,
        )
        memory_db.add(lead)
        memory_db.flush()
        log_audit_event(
            db=memory_db,
            action="lead.create",
            resource_type="lead",
            resource_id=lead.id,
        )
        # Simulate unexpected failure before transaction concludes
        raise RuntimeError("Simulated crash")

    # Neither the lead nor the audit log should exist
    assert memory_db.query(Lead).filter_by(title="Failed Deal").first() is None
    assert memory_db.query(AuditLog).count() == 0
