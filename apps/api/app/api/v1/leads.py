"""Leads API: Pipeline, Kanban Stages, Follow-ups, and Safe Client Conversion."""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.policies.rbac import require_permission, AccessScope
from app.core.audit import log_audit_event
from app.api.schemas import ApiResponse, PaginatedData
from app.db.models.crm import Lead, LeadActivity, Client, ClientContact
from app.db.models.auth import User

router = APIRouter(prefix="/leads", tags=["Leads"])


class LeadItem(BaseModel):
    id: str
    title: str
    company_name: Optional[str] = None
    contact_name: str
    email: str
    phone: Optional[str] = None
    source: str
    status: str
    estimated_value_rupees: float
    assigned_to_name: Optional[str] = None
    converted_client_id: Optional[str] = None
    created_at: str


class CreateLeadRequest(BaseModel):
    title: str
    company_name: Optional[str] = None
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    source: str = "website"
    status: str = "new"
    estimated_value_paise: int = 0
    assigned_to_id: Optional[str] = None
    notes: Optional[str] = None


class ConvertLeadRequest(BaseModel):
    client_code: str
    gstin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


@router.get("", response_model=ApiResponse[PaginatedData[LeadItem]])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    scope: AccessScope = Depends(require_permission("leads.read")),
    db: Session = Depends(get_db),
):
    """List leads with stage filters and scoping."""
    query = db.query(Lead).filter(Lead.is_deleted == False)

    if scope.scope == "own":
        query = query.filter(Lead.assigned_to_id == scope.user.id)

    if status_filter:
        query = query.filter(Lead.status == status_filter)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Lead.title.ilike(search_fmt))
            | (Lead.company_name.ilike(search_fmt))
            | (Lead.contact_name.ilike(search_fmt))
            | (Lead.email.ilike(search_fmt))
        )

    total = query.count()
    leads = (
        query.order_by(desc(Lead.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for l in leads:
        assigned = db.query(User).filter_by(id=l.assigned_to_id).first() if l.assigned_to_id else None
        items.append(
            LeadItem(
                id=l.id,
                title=l.title,
                company_name=l.company_name,
                contact_name=l.contact_name,
                email=l.email,
                phone=l.phone,
                source=l.source,
                status=l.status,
                estimated_value_rupees=round(l.estimated_value_paise / 100.0, 2),
                assigned_to_name=assigned.full_name if assigned else None,
                converted_client_id=l.converted_client_id,
                created_at=l.created_at.isoformat(),
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


@router.post("", response_model=ApiResponse[str])
def create_lead(
    payload: CreateLeadRequest,
    scope: AccessScope = Depends(require_permission("leads.create")),
    db: Session = Depends(get_db),
):
    """Create a new lead."""
    lead = Lead(
        organization_id=scope.user.organization_id,
        title=payload.title.strip(),
        company_name=payload.company_name.strip() if payload.company_name else None,
        contact_name=payload.contact_name.strip(),
        email=payload.email.lower(),
        phone=payload.phone,
        source=payload.source,
        status=payload.status,
        estimated_value_paise=payload.estimated_value_paise,
        assigned_to_id=payload.assigned_to_id or scope.user.id,
        notes=payload.notes,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    log_audit_event(
        db=db,
        action="lead.create",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        new_values={"title": lead.title, "email": lead.email},
    )

    return ApiResponse(success=True, data=lead.id, message="Lead created successfully.")


@router.post("/{lead_id}/convert", response_model=ApiResponse[str])
def convert_lead_to_client(
    lead_id: str,
    payload: ConvertLeadRequest,
    scope: AccessScope = Depends(require_permission("leads.convert")),
    db: Session = Depends(get_db),
):
    """Convert won lead into a client record without duplicates."""
    lead = db.query(Lead).filter_by(id=lead_id, is_deleted=False).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    if lead.converted_client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead has already been converted to a client.",
        )

    # Check duplicate client code
    existing_client = db.query(Client).filter_by(code=payload.client_code.strip()).first()
    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Client with code '{payload.client_code}' already exists.",
        )

    # Create client
    client_name = lead.company_name or lead.contact_name
    client = Client(
        organization_id=lead.organization_id,
        name=client_name,
        code=payload.client_code.strip(),
        gstin=payload.gstin,
        city=payload.city,
        state=payload.state,
        country="India",
        account_manager_id=lead.assigned_to_id or scope.user.id,
        created_from_lead_id=lead.id,
        status="active",
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    # Create primary contact
    contact = ClientContact(
        client_id=client.id,
        name=lead.contact_name,
        email=lead.email,
        phone=lead.phone,
        designation="Lead Contact",
        is_primary=True,
    )
    db.add(contact)

    # Mark lead as won and link converted client
    lead.status = "won"
    lead.converted_client_id = client.id
    db.commit()

    log_audit_event(
        db=db,
        action="lead.converted",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        new_values={"client_id": client.id, "client_name": client.name},
    )

    return ApiResponse(
        success=True,
        data=client.id,
        message=f"Lead converted to client '{client.name}' successfully.",
    )
