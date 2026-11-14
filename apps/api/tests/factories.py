"""Test object factories for isolated database testing.

Creates test records with deterministic, collision-free UUIDs and defaults.
"""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models.auth import Organization, Role, User, UserRole
from app.db.models.crm import Client, ClientContact, Lead, ServiceCatalogue
from app.db.models.finance import Invoice, InvoiceLineItem
from app.db.models.projects import Project


def unique_id(prefix: str = "test") -> str:
    """Generate a short unique suffix for collision-free codes/emails."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def make_org(db: Session, name: str = "Test Agency", slug: str | None = None) -> Organization:
    """Create test organization."""
    if not slug:
        slug = unique_id("org")
    org = Organization(name=name, slug=slug)
    db.add(org)
    db.flush()
    return org


def make_role(db: Session, code: str = "super_admin", role_type: str = "internal") -> Role:
    """Find or create role."""
    role = db.query(Role).filter_by(code=code).first()
    if not role:
        role = Role(code=code, name=code.replace("_", " ").title(), role_type=role_type)
        db.add(role)
        db.flush()
    return role


def make_user(
    db: Session,
    org: Organization | None = None,
    email: str | None = None,
    password: str = "TestPass@123!",
    role: str = "super_admin",
    user_type: str = "internal",
    first_name: str = "Test",
    last_name: str = "User",
    is_super_admin: bool = False,
) -> User:
    """Create test user with assigned role."""
    if not org:
        org = make_org(db)
    if not email:
        email = f"{unique_id('user')}@example.com"

    user = User(
        organization_id=org.id,
        email=email,
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        user_type=user_type,
        is_active=True,
        is_suspended=False,
        is_super_admin=is_super_admin or (role == "super_admin"),
    )
    db.add(user)
    db.flush()

    role_obj = make_role(db, code=role, role_type=user_type)
    ur = UserRole(user_id=user.id, role_id=role_obj.id)
    db.add(ur)
    db.flush()
    return user


def make_client(
    db: Session,
    org: Organization | None = None,
    name: str = "Acme Global",
    code: str | None = None,
    status: str = "active",
    account_manager: User | None = None,
) -> Client:
    """Create test client."""
    if not org:
        org = make_org(db)
    if not code:
        code = unique_id("CLI").upper()

    client = Client(
        organization_id=org.id,
        name=name,
        brand_name=name,
        code=code,
        status=status,
        account_manager_id=account_manager.id if account_manager else None,
    )
    db.add(client)
    db.flush()
    return client


def make_contact(
    db: Session,
    client: Client,
    user: User | None = None,
    email: str | None = None,
    name: str = "Acme Contact",
    is_primary: bool = True,
) -> ClientContact:
    """Create test client contact."""
    if not email:
        email = f"{unique_id('contact')}@example.com"

    contact = ClientContact(
        client_id=client.id,
        user_id=user.id if user else None,
        name=name,
        email=email,
        phone="+91 99999 11111",
        designation="Director",
        is_primary=is_primary,
    )
    db.add(contact)
    db.flush()
    return contact


def make_service(
    db: Session,
    name: str = "Web Development",
    code: str | None = None,
    price_paise: int = 8000000,
    category: str = "web",
) -> ServiceCatalogue:
    """Create test service catalogue item."""
    if not code:
        code = unique_id("SVC").upper()

    svc = ServiceCatalogue(
        name=name,
        code=code,
        category=category,
        pricing_type="fixed",
        default_price_paise=price_paise,
    )
    db.add(svc)
    db.flush()
    return svc


def make_lead(
    db: Session,
    org: Organization | None = None,
    owner: User | None = None,
    title: str = "Test Lead Opportunity",
    val_paise: int = 5000000,
    status: str = "new",
) -> Lead:
    """Create test lead."""
    if not org:
        org = make_org(db)

    lead = Lead(
        organization_id=org.id,
        title=title,
        company_name=title,
        contact_name="Lead Contact",
        email=f"{unique_id('lead')}@example.com",
        status=status,
        assigned_to_id=owner.id if owner else None,
        estimated_value_paise=val_paise,
    )
    db.add(lead)
    db.flush()
    return lead


def make_project(
    db: Session,
    client: Client,
    name: str = "Corporate Website",
    code: str | None = None,
    manager: User | None = None,
    status: str = "in_progress",
) -> Project:
    """Create test project."""
    if not code:
        code = unique_id("PRJ").upper()

    now = datetime.now(UTC)
    proj = Project(
        client_id=client.id,
        name=name,
        code=code,
        status=status,
        manager_id=manager.id if manager else None,
        start_date=now.date(),
        due_date=(now + timedelta(days=30)).date(),
    )
    db.add(proj)
    db.flush()
    return proj


def make_invoice(
    db: Session,
    client: Client,
    number: str | None = None,
    status: str = "issued",
    subtotal_paise: int = 8000000,
    tax_paise: int = 1440000,
) -> Invoice:
    """Create test invoice with line items."""
    if not number:
        number = unique_id("INV").upper()

    now = datetime.now(UTC)
    total_paise = subtotal_paise + tax_paise
    inv = Invoice(
        invoice_number=number,
        client_id=client.id,
        issue_date=now.date(),
        due_date=(now + timedelta(days=15)).date(),
        status=status,
        subtotal_paise=subtotal_paise,
        total_tax_paise=tax_paise,
        total_paise=total_paise,
        amount_paid_paise=0,
        balance_paise=total_paise,
        client_name_snapshot=client.name,
    )
    db.add(inv)
    db.flush()

    line = InvoiceLineItem(
        invoice_id=inv.id,
        description="Core Service Deliverable",
        quantity=1,
        unit_price_paise=subtotal_paise,
        tax_rate_percent=18,
        tax_amount_paise=tax_paise,
        total_paise=total_paise,
    )
    db.add(line)
    db.flush()
    return inv
