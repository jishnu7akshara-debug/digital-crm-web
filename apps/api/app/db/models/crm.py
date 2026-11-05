"""CRM & Sales Models: Clients, Services, Leads, Proposals, Contracts."""
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, SoftDeleteMixin, uuid_pk


class Client(Base, TimestampMixin, SoftDeleteMixin):
    """Client account entity. One client can buy multiple ClientServices and run multiple projects."""
    __tablename__ = "clients"

    id: Mapped[str] = uuid_pk()
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)  # "lead", "active", "on_hold", "inactive"
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    account_manager_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_from_lead_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    contacts: Mapped[List["ClientContact"]] = relationship("ClientContact", back_populates="client", cascade="all, delete-orphan")
    services: Mapped[List["ClientService"]] = relationship("ClientService", back_populates="client", cascade="all, delete-orphan")


class ClientContact(Base, TimestampMixin, SoftDeleteMixin):
    """Client contact person; optionally linked to a portal User account."""
    __tablename__ = "client_contacts"

    id: Mapped[str] = uuid_pk()
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    client: Mapped["Client"] = relationship("Client", back_populates="contacts")


class ServiceCatalogue(Base, TimestampMixin, SoftDeleteMixin):
    """Configurable service offerings: Web, App, SEO, Social, Branding, CRM/ERP, EdTech."""
    __tablename__ = "service_catalogue"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # "web", "app", "seo", "social", "branding", "crm_erp", "edtech"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pricing_type: Mapped[str] = mapped_column(
        String(30), default="fixed", nullable=False
    )  # "fixed", "hourly", "subscription", "custom"
    default_price_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    hsn_sac_code: Mapped[Optional[str]] = mapped_column(String(20), default="998314", nullable=True)
    default_workflow: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON serialized workflow steps
    renewal_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ClientService(Base, TimestampMixin, SoftDeleteMixin):
    """A client's purchased service / subscription."""
    __tablename__ = "client_services"

    id: Mapped[str] = uuid_pk()
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("service_catalogue.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="active", nullable=False
    )  # "active", "completed", "paused", "cancelled"
    price_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    billing_cycle: Mapped[str] = mapped_column(
        String(30), default="one_time", nullable=False
    )  # "one_time", "monthly", "quarterly", "annual"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    renewal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    client: Mapped["Client"] = relationship("Client", back_populates="services")
    service: Mapped["ServiceCatalogue"] = relationship("ServiceCatalogue")


class Lead(Base, TimestampMixin, SoftDeleteMixin):
    """Sales lead with pipeline stages and conversion tracking."""
    __tablename__ = "leads"

    id: Mapped[str] = uuid_pk()
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="website", nullable=False)  # "website", "referral", "social", "cold_outreach", "inbound"
    status: Mapped[str] = mapped_column(
        String(30), default="new", nullable=False, index=True
    )  # "new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost", "on_hold"
    estimated_value_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    assigned_to_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    converted_client_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True
    )
    lost_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    activities: Mapped[List["LeadActivity"]] = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base, TimestampMixin):
    """Activity tracking and follow-up tasks for leads."""
    __tablename__ = "lead_activities"

    id: Mapped[str] = uuid_pk()
    lead_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "call", "meeting", "email", "note", "stage_change", "follow_up"
    notes: Mapped[Text] = mapped_column(Text, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    lead: Mapped["Lead"] = relationship("Lead", back_populates="activities")


class Proposal(Base, TimestampMixin, SoftDeleteMixin):
    """Proposals sent to leads or clients with versioning."""
    __tablename__ = "proposals"

    id: Mapped[str] = uuid_pk()
    proposal_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    client_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True
    )
    lead_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False, index=True
    )  # "draft", "sent", "viewed", "accepted", "rejected", "expired"
    subtotal_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    discount_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    tax_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    terms_and_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    valid_until: Mapped[date] = mapped_column(Date, nullable=False)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    line_items: Mapped[List["ProposalLineItem"]] = relationship("ProposalLineItem", back_populates="proposal", cascade="all, delete-orphan")


class ProposalLineItem(Base):
    """Individual line items within a proposal."""
    __tablename__ = "proposal_line_items"

    id: Mapped[str] = uuid_pk()
    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("service_catalogue.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    proposal: Mapped["Proposal"] = relationship("Proposal", back_populates="line_items")


class Contract(Base, TimestampMixin, SoftDeleteMixin):
    """Signed contracts and renewal agreements."""
    __tablename__ = "contracts"

    id: Mapped[str] = uuid_pk()
    contract_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    proposal_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    value_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    renewal_frequency: Mapped[str] = mapped_column(
        String(30), default="none", nullable=False
    )  # "none", "monthly", "quarterly", "annual"
    status: Mapped[str] = mapped_column(
        String(30), default="active", nullable=False, index=True
    )  # "draft", "active", "expiring_soon", "renewed", "terminated"
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    terms_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
