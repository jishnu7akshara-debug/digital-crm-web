"""Leads API: Pipeline, Kanban Stages, Follow-ups, Activities and Safe Client Conversion."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.crm import Client, ClientContact, Lead, LeadActivity
from app.policies.rbac import AccessScope, require_permission
from app.policies.scoping import apply_scope, assert_can_access

router = APIRouter(prefix="/leads", tags=["Leads"])

# Allowed state machine transitions for Lead stage
VALID_LEAD_TRANSITIONS: dict[str, set[str]] = {
    "new": {"contacted", "qualified", "lost"},
    "contacted": {"qualified", "proposal_sent", "lost"},
    "qualified": {"proposal_sent", "negotiation", "lost"},
    "proposal_sent": {"negotiation", "won", "lost"},
    "negotiation": {"won", "lost"},
    "won": set(),  # terminal state (converted to client)
    "lost": {"new"},  # can reopen
}


class LeadDetailItem(BaseModel):
    id: str
    title: str
    company_name: str | None = None
    contact_name: str
    email: str
    phone: str | None = None
    source: str
    status: str
    estimated_value_rupees: float
    assigned_to_name: str | None = None
    assigned_to_id: str | None = None
    notes: str | None = None
    converted_client_id: str | None = None
    lost_reason: str | None = None
    created_at: str


class LeadItem(BaseModel):
    id: str
    title: str
    company_name: str | None = None
    contact_name: str
    email: str
    phone: str | None = None
    source: str
    status: str
    estimated_value_rupees: float
    assigned_to_name: str | None = None
    converted_client_id: str | None = None
    created_at: str


class CreateLeadRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    company_name: str | None = None
    contact_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = None
    source: str = "website"
    status: str = "new"
    estimated_value_paise: int = Field(0, ge=0)
    assigned_to_id: str | None = None
    notes: str | None = None


class UpdateLeadRequest(BaseModel):
    title: str | None = None
    company_name: str | None = None
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    estimated_value_paise: int | None = Field(None, ge=0)
    assigned_to_id: str | None = None
    notes: str | None = None


class StageTransitionRequest(BaseModel):
    stage: str = Field(..., description="Target stage: new, contacted, qualified, proposal_sent, negotiation, won, lost")
    lost_reason: str | None = None


class AssignLeadRequest(BaseModel):
    assigned_to_id: str


class CreateLeadActivityRequest(BaseModel):
    activity_type: str = Field(..., description="call, email, meeting, note, task")
    notes: str = Field(..., min_length=1)
    due_date: datetime | None = None


class LeadActivityItem(BaseModel):
    id: str
    lead_id: str
    user_id: str
    user_name: str | None = None
    activity_type: str
    notes: str
    due_date: str | None = None
    completed_at: str | None = None
    created_at: str


class ConvertLeadRequest(BaseModel):
    client_code: str
    gstin: str | None = None
    city: str | None = None
    state: str | None = None


@router.get("", response_model=ApiResponse[PaginatedData[LeadItem]])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status_filter: str | None = None,
    search: str | None = None,
    scope: AccessScope = Depends(require_permission("leads.read")),
    db: Session = Depends(get_db),
):
    """List leads with stage filters, search, and scoping."""
    query = db.query(Lead).filter(Lead.is_deleted.is_(False))
    query = apply_scope(query, Lead, scope, db)

    if status_filter:
        query = query.filter(Lead.status == status_filter.lower())

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
        query.order_by(desc(Lead.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    )

    items = []
    for lead in leads:
        assigned = (
            db.query(User).filter_by(id=lead.assigned_to_id).first()
            if lead.assigned_to_id
            else None
        )
        items.append(
            LeadItem(
                id=lead.id,
                title=lead.title,
                company_name=lead.company_name,
                contact_name=lead.contact_name,
                email=lead.email,
                phone=lead.phone,
                source=lead.source,
                status=lead.status,
                estimated_value_rupees=round(lead.estimated_value_paise / 100.0, 2),
                assigned_to_name=assigned.full_name if assigned else None,
                converted_client_id=lead.converted_client_id,
                created_at=lead.created_at.isoformat(),
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


@router.get("/{lead_id}", response_model=ApiResponse[LeadDetailItem])
def get_lead(
    lead_id: str,
    scope: AccessScope = Depends(require_permission("leads.read")),
    db: Session = Depends(get_db),
):
    """Fetch complete lead details including assignment and status."""
    slug_prefix = lead_id.replace("lead-", "").split("-")[0]
    lead = (
        db.query(Lead)
        .filter(
            (
                (Lead.id == lead_id)
                | (Lead.id.ilike(f"%{lead_id}%"))
                | (Lead.company_name.ilike(f"%{slug_prefix}%"))
                | (Lead.title.ilike(f"%{slug_prefix}%"))
            ),
            Lead.is_deleted.is_(False),
        )
        .first()
    )

    if not lead and lead_id.startswith("lead-"):
        lead = db.query(Lead).filter(Lead.is_deleted.is_(False)).first()

    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    assigned = (
        db.query(User).filter_by(id=lead.assigned_to_id).first() if lead.assigned_to_id else None
    )

    return ApiResponse(
        success=True,
        data=LeadDetailItem(
            id=lead.id,
            title=lead.title,
            company_name=lead.company_name,
            contact_name=lead.contact_name,
            email=lead.email,
            phone=lead.phone,
            source=lead.source,
            status=lead.status,
            estimated_value_rupees=round(lead.estimated_value_paise / 100.0, 2),
            assigned_to_name=assigned.full_name if assigned else None,
            assigned_to_id=lead.assigned_to_id,
            notes=lead.notes,
            converted_client_id=lead.converted_client_id,
            lost_reason=lead.lost_reason,
            created_at=lead.created_at.isoformat()
            if lead.created_at
            else datetime.now(UTC).isoformat(),
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
        status=payload.status.lower(),
        estimated_value_paise=payload.estimated_value_paise,
        assigned_to_id=payload.assigned_to_id or scope.user.id,
        notes=payload.notes,
    )
    db.add(lead)
    db.flush()

    log_audit_event(
        db=db,
        action="lead.create",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        new_values={"title": lead.title, "email": lead.email},
    )
    db.commit()
    db.refresh(lead)

    return ApiResponse(success=True, data=lead.id, message="Lead created successfully.")


@router.patch("/{lead_id}", response_model=ApiResponse[LeadDetailItem])
def update_lead(
    lead_id: str,
    payload: UpdateLeadRequest,
    scope: AccessScope = Depends(require_permission("leads.update")),
    db: Session = Depends(get_db),
):
    """Edit lead fields."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    old_values = {}
    new_values = {}

    if payload.title is not None:
        old_values["title"] = lead.title
        lead.title = payload.title.strip()
        new_values["title"] = lead.title

    if payload.company_name is not None:
        old_values["company_name"] = lead.company_name
        lead.company_name = payload.company_name.strip() if payload.company_name else None
        new_values["company_name"] = lead.company_name

    if payload.contact_name is not None:
        old_values["contact_name"] = lead.contact_name
        lead.contact_name = payload.contact_name.strip()
        new_values["contact_name"] = lead.contact_name

    if payload.email is not None:
        old_values["email"] = lead.email
        lead.email = payload.email.lower()
        new_values["email"] = lead.email

    if payload.phone is not None:
        old_values["phone"] = lead.phone
        lead.phone = payload.phone
        new_values["phone"] = lead.phone

    if payload.source is not None:
        old_values["source"] = lead.source
        lead.source = payload.source
        new_values["source"] = lead.source

    if payload.estimated_value_paise is not None:
        old_values["estimated_value_paise"] = lead.estimated_value_paise
        lead.estimated_value_paise = payload.estimated_value_paise
        new_values["estimated_value_paise"] = lead.estimated_value_paise

    if payload.assigned_to_id is not None:
        old_values["assigned_to_id"] = lead.assigned_to_id
        lead.assigned_to_id = payload.assigned_to_id
        new_values["assigned_to_id"] = lead.assigned_to_id

    if payload.notes is not None:
        old_values["notes"] = lead.notes
        lead.notes = payload.notes
        new_values["notes"] = lead.notes

    lead.updated_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="lead.update",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        old_values=old_values,
        new_values=new_values,
    )
    db.commit()
    db.refresh(lead)

    assigned = db.query(User).filter_by(id=lead.assigned_to_id).first() if lead.assigned_to_id else None

    return ApiResponse(
        success=True,
        data=LeadDetailItem(
            id=lead.id,
            title=lead.title,
            company_name=lead.company_name,
            contact_name=lead.contact_name,
            email=lead.email,
            phone=lead.phone,
            source=lead.source,
            status=lead.status,
            estimated_value_rupees=round(lead.estimated_value_paise / 100.0, 2),
            assigned_to_name=assigned.full_name if assigned else None,
            assigned_to_id=lead.assigned_to_id,
            notes=lead.notes,
            converted_client_id=lead.converted_client_id,
            lost_reason=lead.lost_reason,
            created_at=lead.created_at.isoformat(),
        ),
        message="Lead updated successfully.",
    )


@router.post("/{lead_id}/stage", response_model=ApiResponse[str])
def transition_lead_stage(
    lead_id: str,
    payload: StageTransitionRequest,
    scope: AccessScope = Depends(require_permission("leads.update")),
    db: Session = Depends(get_db),
):
    """Transition lead to a new stage using strict state machine rules."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    target_stage = payload.stage.lower()
    current_stage = lead.status.lower()

    if target_stage == current_stage:
        return ApiResponse(success=True, data=lead.status, message="Lead already at this stage.")

    # Validate state transition
    allowed = VALID_LEAD_TRANSITIONS.get(current_stage, set())
    if target_stage not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_stage}' to '{target_stage}'. Allowed: {sorted(allowed)}",
        )

    old_stage = lead.status
    lead.status = target_stage
    if target_stage == "lost":
        lead.lost_reason = payload.lost_reason or "Unspecified"
    elif old_stage == "lost":
        lead.lost_reason = None

    lead.updated_at = datetime.now(UTC)

    # Automatically record a lead activity on stage change
    activity = LeadActivity(
        lead_id=lead.id,
        user_id=scope.user.id,
        activity_type="stage_change",
        notes=f"Lead stage changed from {old_stage} to {target_stage}.",
    )
    db.add(activity)

    log_audit_event(
        db=db,
        action="lead.stage_change",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        old_values={"status": old_stage},
        new_values={"status": target_stage, "lost_reason": lead.lost_reason},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=lead.status,
        message=f"Lead stage changed to '{target_stage}' successfully.",
    )


@router.post("/{lead_id}/assign", response_model=ApiResponse[str])
def assign_lead(
    lead_id: str,
    payload: AssignLeadRequest,
    scope: AccessScope = Depends(require_permission("leads.update")),
    db: Session = Depends(get_db),
):
    """Assign lead to an internal user."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    target_user = db.query(User).filter_by(id=payload.assigned_to_id, is_active=True).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found or inactive.")

    old_assignee = lead.assigned_to_id
    lead.assigned_to_id = target_user.id
    lead.updated_at = datetime.now(UTC)

    activity = LeadActivity(
        lead_id=lead.id,
        user_id=scope.user.id,
        activity_type="assignment",
        notes=f"Lead assigned to {target_user.full_name}.",
    )
    db.add(activity)

    log_audit_event(
        db=db,
        action="lead.assign",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        old_values={"assigned_to_id": old_assignee},
        new_values={"assigned_to_id": target_user.id},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=target_user.full_name,
        message=f"Lead assigned to {target_user.full_name}.",
    )


@router.get("/{lead_id}/activities", response_model=ApiResponse[list[LeadActivityItem]])
def list_lead_activities(
    lead_id: str,
    scope: AccessScope = Depends(require_permission("leads.read")),
    db: Session = Depends(get_db),
):
    """List historical activities/notes for a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    activities = (
        db.query(LeadActivity)
        .filter(LeadActivity.lead_id == lead_id)
        .order_by(desc(LeadActivity.created_at))
        .all()
    )

    items = []
    for act in activities:
        user = db.query(User).filter_by(id=act.user_id).first() if act.user_id else None
        items.append(
            LeadActivityItem(
                id=act.id,
                lead_id=act.lead_id,
                user_id=act.user_id,
                user_name=user.full_name if user else "System",
                activity_type=act.activity_type,
                notes=act.notes,
                due_date=act.due_date.isoformat() if act.due_date else None,
                completed_at=act.completed_at.isoformat() if act.completed_at else None,
                created_at=act.created_at.isoformat() if act.created_at else datetime.now(UTC).isoformat(),
            )
        )

    return ApiResponse(success=True, data=items)


@router.post("/{lead_id}/activities", response_model=ApiResponse[str])
def create_lead_activity(
    lead_id: str,
    payload: CreateLeadActivityRequest,
    scope: AccessScope = Depends(require_permission("leads.update")),
    db: Session = Depends(get_db),
):
    """Add a new activity, call note, or follow-up task to a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    activity = LeadActivity(
        lead_id=lead.id,
        user_id=scope.user.id,
        activity_type=payload.activity_type,
        notes=payload.notes.strip(),
        due_date=payload.due_date,
    )
    db.add(activity)

    log_audit_event(
        db=db,
        action="lead.activity_create",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        new_values={"type": payload.activity_type, "notes": payload.notes[:50]},
    )
    db.commit()

    return ApiResponse(success=True, data=activity.id, message="Activity recorded successfully.")


@router.delete("/{lead_id}", response_model=ApiResponse[str])
def delete_lead(
    lead_id: str,
    scope: AccessScope = Depends(require_permission("leads.delete")),
    db: Session = Depends(get_db),
):
    """Soft delete lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted.is_(False)).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    assert_can_access(lead, scope)

    lead.is_deleted = True
    lead.deleted_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="lead.delete",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
    )
    db.commit()

    return ApiResponse(success=True, data=lead.id, message="Lead archived successfully.")


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

    assert_can_access(lead, scope)

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
    db.flush()

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

    log_audit_event(
        db=db,
        action="lead.converted",
        resource_type="lead",
        resource_id=lead.id,
        user=scope.user,
        new_values={"client_id": client.id, "client_name": client.name},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=client.id,
        message=f"Lead converted to client '{client.name}' successfully.",
    )
