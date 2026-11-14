"""Unit tests for the RBAC scoping engine and portal isolation (B-12, B-20)."""

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.models.auth import Organization, Role, User
from app.db.models.crm import Client, Lead
from app.db.models.finance import Invoice
from app.policies.rbac import AccessScope
from app.policies.scoping import apply_scope, assert_can_access


@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(
        bind=engine,
        tables=[
            Organization.__table__,
            Role.__table__,
            User.__table__,
            Client.__table__,
            Lead.__table__,
            Invoice.__table__,
        ],
    )
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_super_admin_unbounded_scope(memory_db: Session):
    admin = User(
        organization_id="org-1",
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        user_type="internal",
        is_super_admin=True,
    )
    scope = AccessScope(
        user=admin,
        permission="invoices.read",
        scope="all",
        is_super_admin=True,
    )

    query = memory_db.query(Invoice)
    scoped_query = apply_scope(query, Invoice, scope, memory_db)
    # No extra where clauses added for super admin
    assert str(query) == str(scoped_query)


def test_client_portal_isolation(memory_db: Session):
    client_user = User(
        organization_id="org-1",
        email="client@clienta.com",
        hashed_password="hash",
        first_name="Client",
        last_name="Owner",
        user_type="client",
        is_super_admin=False,
    )
    scope = AccessScope(
        user=client_user,
        permission="invoices.read",
        scope="client",
        is_super_admin=False,
        client_id="client-a",
    )

    from datetime import date

    # Creating invoice for client A and invoice for client B
    inv_a = Invoice(
        id="inv-a",
        client_id="client-a",
        invoice_number="INV-001",
        client_name_snapshot="Client A",
        issue_date=date(2026, 11, 1),
        due_date=date(2026, 11, 15),
    )
    inv_b = Invoice(
        id="inv-b",
        client_id="client-b",
        invoice_number="INV-002",
        client_name_snapshot="Client B",
        issue_date=date(2026, 11, 1),
        due_date=date(2026, 11, 15),
    )
    memory_db.add_all([inv_a, inv_b])
    memory_db.commit()

    query = memory_db.query(Invoice)
    scoped_invoices = apply_scope(query, Invoice, scope, memory_db).all()

    assert len(scoped_invoices) == 1
    assert scoped_invoices[0].id == "inv-a"

    # Direct record access check
    assert_can_access(inv_a, scope)  # Allowed

    with pytest.raises(HTTPException) as exc:
        assert_can_access(inv_b, scope)
    assert exc.value.status_code == 403


def test_assigned_scoping_for_leads(memory_db: Session):
    sales_rep = User(
        id="rep-1",
        organization_id="org-1",
        email="sales@example.com",
        hashed_password="hash",
        first_name="Sales",
        last_name="Rep",
        user_type="internal",
        is_super_admin=False,
    )
    other_rep = User(
        id="rep-2",
        organization_id="org-1",
        email="other@example.com",
        hashed_password="hash",
        first_name="Other",
        last_name="Rep",
        user_type="internal",
        is_super_admin=False,
    )
    memory_db.add_all([sales_rep, other_rep])

    lead_mine = Lead(
        id="lead-mine",
        organization_id="org-1",
        title="My Lead",
        company_name="Alpha Corp",
        contact_name="Alice",
        email="alice@alpha.com",
        assigned_to_id="rep-1",
    )
    lead_other = Lead(
        id="lead-other",
        organization_id="org-1",
        title="Other Lead",
        company_name="Beta Corp",
        contact_name="Bob",
        email="bob@beta.com",
        assigned_to_id="rep-2",
    )
    lead_unassigned = Lead(
        id="lead-unassigned",
        organization_id="org-1",
        title="Unassigned Lead",
        company_name="Gamma Corp",
        contact_name="Charlie",
        email="charlie@gamma.com",
        assigned_to_id=None,
    )
    memory_db.add_all([lead_mine, lead_other, lead_unassigned])
    memory_db.commit()

    scope = AccessScope(
        user=sales_rep,
        permission="leads.read",
        scope="assigned",
        is_super_admin=False,
    )

    query = memory_db.query(Lead)
    scoped_leads = apply_scope(query, Lead, scope, memory_db).all()

    assert len(scoped_leads) == 1
    assert scoped_leads[0].id == "lead-mine"

    assert_can_access(lead_mine, scope)
    with pytest.raises(HTTPException) as exc:
        assert_can_access(lead_other, scope)
    assert exc.value.status_code == 403
