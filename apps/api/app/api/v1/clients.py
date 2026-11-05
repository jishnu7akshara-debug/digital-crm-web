"""Clients API: Client 360, Service Subscriptions, Multi-Tenant Client Isolation."""
from datetime import datetime, date, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.policies.rbac import require_permission, verify_client_isolation, AccessScope
from app.core.audit import log_audit_event
from app.api.schemas import ApiResponse, PaginatedData
from app.db.models.crm import Client, ClientContact, ClientService, ServiceCatalogue, Contract, Proposal
from app.db.models.projects import Project
from app.db.models.finance import Invoice, Payment
from app.db.models.support import SupportTicket
from app.db.models.auth import User

router = APIRouter(prefix="/clients", tags=["Clients"])


class ClientSummary(BaseModel):
    id: str
    name: str
    brand_name: Optional[str] = None
    code: str
    status: str
    gstin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    account_manager_name: Optional[str] = None
    active_services_count: int
    active_projects_count: int
    total_invoiced_rupees: float
    outstanding_rupees: float


class ClientContactItem(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    is_primary: bool


class ClientServiceItem(BaseModel):
    id: str
    service_id: str
    service_name: str
    category: str
    status: str
    price_rupees: float
    billing_cycle: str
    start_date: str
    renewal_date: Optional[str] = None


class Client360Detail(BaseModel):
    id: str
    name: str
    brand_name: Optional[str] = None
    code: str
    status: str
    gstin: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    postal_code: Optional[str] = None
    account_manager: Optional[Dict[str, str]] = None
    contacts: List[ClientContactItem]
    services: List[ClientServiceItem]
    projects: List[Dict[str, Any]]
    invoices: List[Dict[str, Any]]
    contracts: List[Dict[str, Any]]
    proposals: List[Dict[str, Any]]
    support_tickets: List[Dict[str, Any]]
    metrics: Dict[str, Any]


class CreateClientRequest(BaseModel):
    name: str
    brand_name: Optional[str] = None
    code: str
    gstin: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    postal_code: Optional[str] = None
    account_manager_id: Optional[str] = None
    primary_contact_name: str
    primary_contact_email: EmailStr
    primary_contact_phone: Optional[str] = None
    primary_contact_designation: Optional[str] = "Owner"


class SubscribeServiceRequest(BaseModel):
    service_id: str
    price_paise: int
    billing_cycle: str = "one_time"  # "one_time", "monthly", "quarterly", "annual"
    start_date: date
    renewal_date: Optional[date] = None


@router.get("", response_model=ApiResponse[PaginatedData[ClientSummary]])
def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    scope: AccessScope = Depends(require_permission("clients.read")),
    db: Session = Depends(get_db),
):
    """List clients with scoping, pagination, and calculated financial summaries."""
    query = db.query(Client).filter(Client.is_deleted == False)

    # Multi-tenant and RBAC scoping
    if scope.user.user_type == "client":
        query = query.filter(Client.id == scope.client_id)
    elif scope.scope == "assigned":
        query = query.filter(Client.account_manager_id == scope.user.id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Client.name.ilike(search_fmt)) | (Client.code.ilike(search_fmt)) | (Client.gstin.ilike(search_fmt))
        )
    if status_filter:
        query = query.filter(Client.status == status_filter)

    total = query.count()
    clients = (
        query.order_by(desc(Client.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for c in clients:
        am = db.query(User).filter_by(id=c.account_manager_id).first() if c.account_manager_id else None
        active_services = db.query(ClientService).filter_by(client_id=c.id, is_deleted=False).count()
        active_projects = db.query(Project).filter_by(client_id=c.id, is_deleted=False).count()
        invoices = db.query(Invoice).filter(Invoice.client_id == c.id, Invoice.is_deleted == False, Invoice.status != "cancelled").all()
        invoiced_paise = sum(i.total_paise for i in invoices)
        outstanding_paise = sum(i.balance_paise for i in invoices)

        items.append(
            ClientSummary(
                id=c.id,
                name=c.name,
                brand_name=c.brand_name,
                code=c.code,
                status=c.status,
                gstin=c.gstin,
                city=c.city,
                state=c.state,
                account_manager_name=am.full_name if am else None,
                active_services_count=active_services,
                active_projects_count=active_projects,
                total_invoiced_rupees=round(invoiced_paise / 100.0, 2),
                outstanding_rupees=round(outstanding_paise / 100.0, 2),
            )
        )

    return ApiResponse(
        success=True,
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size if total > 0 else 1,
        ),
    )


@router.get("/{client_id}", response_model=ApiResponse[Client360Detail])
def get_client_360(
    client_id: str,
    scope: AccessScope = Depends(require_permission("clients.read")),
    db: Session = Depends(get_db),
):
    """Retrieve complete Client 360 profile with all services, projects, invoices, and metrics."""
    verify_client_isolation(client_id, scope)

    client = db.query(Client).filter_by(id=client_id, is_deleted=False).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    am = db.query(User).filter_by(id=client.account_manager_id).first() if client.account_manager_id else None

    # 1. Contacts
    contacts = db.query(ClientContact).filter_by(client_id=client.id, is_deleted=False).all()
    contact_items = [
        ClientContactItem(
            id=ct.id,
            name=ct.name,
            email=ct.email,
            phone=ct.phone,
            designation=ct.designation,
            is_primary=ct.is_primary,
        )
        for ct in contacts
    ]

    # 2. Services
    services = db.query(ClientService).filter_by(client_id=client.id, is_deleted=False).all()
    service_items = []
    for cs in services:
        cat = db.query(ServiceCatalogue).filter_by(id=cs.service_id).first()
        service_items.append(
            ClientServiceItem(
                id=cs.id,
                service_id=cs.service_id,
                service_name=cat.name if cat else "Custom Service",
                category=cat.category if cat else "General",
                status=cs.status,
                price_rupees=round(cs.price_paise / 100.0, 2),
                billing_cycle=cs.billing_cycle,
                start_date=cs.start_date.isoformat(),
                renewal_date=cs.renewal_date.isoformat() if cs.renewal_date else None,
            )
        )

    # 3. Projects
    projects = db.query(Project).filter_by(client_id=client.id, is_deleted=False).all()
    project_items = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "status": p.status,
            "progress_percent": p.progress_percent,
            "due_date": p.due_date.isoformat() if p.due_date else None,
        }
        for p in projects
    ]

    # 4. Invoices
    invoices = db.query(Invoice).filter_by(client_id=client.id, is_deleted=False).order_by(desc(Invoice.issue_date)).all()
    invoice_items = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "issue_date": inv.issue_date.isoformat(),
            "due_date": inv.due_date.isoformat(),
            "status": inv.status,
            "total_rupees": round(inv.total_paise / 100.0, 2),
            "balance_rupees": round(inv.balance_paise / 100.0, 2),
        }
        for inv in invoices
    ]

    # 5. Contracts & Proposals
    contracts = db.query(Contract).filter_by(client_id=client.id, is_deleted=False).all()
    contract_items = [
        {
            "id": ct.id,
            "contract_number": ct.contract_number,
            "title": ct.title,
            "status": ct.status,
            "value_rupees": round(ct.value_paise / 100.0, 2),
            "start_date": ct.start_date.isoformat(),
            "end_date": ct.end_date.isoformat() if ct.end_date else None,
        }
        for ct in contracts
    ]

    proposals = db.query(Proposal).filter_by(client_id=client.id, is_deleted=False).all()
    proposal_items = [
        {
            "id": pr.id,
            "proposal_number": pr.proposal_number,
            "title": pr.title,
            "status": pr.status,
            "total_rupees": round(pr.total_paise / 100.0, 2),
            "valid_until": pr.valid_until.isoformat(),
        }
        for pr in proposals
    ]

    # 6. Support Tickets
    tickets = db.query(SupportTicket).filter_by(client_id=client.id, is_deleted=False).all()
    ticket_items = [
        {
            "id": tk.id,
            "ticket_number": tk.ticket_number,
            "subject": tk.subject,
            "status": tk.status,
            "priority": tk.priority,
            "created_at": tk.created_at.isoformat(),
        }
        for tk in tickets
    ]

    # Metrics
    total_invoiced = sum(i.total_paise for i in invoices if i.status != "cancelled")
    total_collected = sum(i.amount_paid_paise for i in invoices if i.status != "cancelled")
    total_outstanding = sum(i.balance_paise for i in invoices if i.status != "cancelled")

    return ApiResponse(
        success=True,
        data=Client360Detail(
            id=client.id,
            name=client.name,
            brand_name=client.brand_name,
            code=client.code,
            status=client.status,
            gstin=client.gstin,
            website=client.website,
            industry=client.industry,
            address=client.address,
            city=client.city,
            state=client.state,
            country=client.country,
            postal_code=client.postal_code,
            account_manager={"id": am.id, "name": am.full_name, "email": am.email} if am else None,
            contacts=contact_items,
            services=service_items,
            projects=project_items,
            invoices=invoice_items,
            contracts=contract_items,
            proposals=proposal_items,
            support_tickets=ticket_items,
            metrics={
                "total_invoiced_rupees": round(total_invoiced / 100.0, 2),
                "total_collected_rupees": round(total_collected / 100.0, 2),
                "total_outstanding_rupees": round(total_outstanding / 100.0, 2),
                "services_count": len(service_items),
                "projects_count": len(project_items),
            },
        ),
    )


@router.post("", response_model=ApiResponse[str])
def create_client(
    payload: CreateClientRequest,
    scope: AccessScope = Depends(require_permission("clients.create")),
    db: Session = Depends(get_db),
):
    """Register a new client company with primary contact."""
    existing = db.query(Client).filter_by(code=payload.code.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Client code '{payload.code}' already exists.")

    client = Client(
        organization_id=scope.user.organization_id,
        name=payload.name.strip(),
        brand_name=payload.brand_name.strip() if payload.brand_name else None,
        code=payload.code.strip(),
        gstin=payload.gstin.strip() if payload.gstin else None,
        website=payload.website.strip() if payload.website else None,
        industry=payload.industry.strip() if payload.industry else None,
        address=payload.address.strip() if payload.address else None,
        city=payload.city.strip() if payload.city else None,
        state=payload.state.strip() if payload.state else None,
        country=payload.country,
        postal_code=payload.postal_code,
        account_manager_id=payload.account_manager_id or scope.user.id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    # Primary contact
    contact = ClientContact(
        client_id=client.id,
        name=payload.primary_contact_name.strip(),
        email=payload.primary_contact_email.lower(),
        phone=payload.primary_contact_phone,
        designation=payload.primary_contact_designation,
        is_primary=True,
    )
    db.add(contact)
    db.commit()

    log_audit_event(
        db=db,
        action="client.create",
        resource_type="client",
        resource_id=client.id,
        user=scope.user,
        new_values={"name": client.name, "code": client.code},
    )

    return ApiResponse(success=True, data=client.id, message="Client registered successfully.")


@router.post("/{client_id}/services", response_model=ApiResponse[str])
def subscribe_client_service(
    client_id: str,
    payload: SubscribeServiceRequest,
    scope: AccessScope = Depends(require_permission("clients.edit")),
    db: Session = Depends(get_db),
):
    """Subscribe a client to a service from the catalogue."""
    client = db.query(Client).filter_by(id=client_id, is_deleted=False).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    service = db.query(ServiceCatalogue).filter_by(id=payload.service_id, is_active=True).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service offering not found.")

    sub = ClientService(
        client_id=client.id,
        service_id=service.id,
        status="active",
        price_paise=payload.price_paise,
        billing_cycle=payload.billing_cycle,
        start_date=payload.start_date,
        renewal_date=payload.renewal_date,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    log_audit_event(
        db=db,
        action="client.service_subscribed",
        resource_type="client_service",
        resource_id=sub.id,
        user=scope.user,
        new_values={"client_id": client.id, "service_name": service.name, "price_paise": payload.price_paise},
    )

    return ApiResponse(success=True, data=sub.id, message=f"Subscribed to {service.name}.")

