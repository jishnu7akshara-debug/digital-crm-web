"""Support Ticketing API: Client Portal & Internal Desk with SLA Calculation and Strict Privacy."""

import json
from datetime import UTC, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.common import SystemSetting
from app.db.models.crm import Client
from app.db.models.support import SupportTicket, TicketComment
from app.policies.rbac import AccessScope, require_permission, verify_client_isolation
from app.policies.scoping import apply_scope, assert_can_access

router = APIRouter(prefix="/support", tags=["Support Tickets"])

# --- Valid State Machine Transitions ---
VALID_TICKET_TRANSITIONS: dict[str, list[str]] = {
    "open": ["in_progress", "closed"],
    "in_progress": ["waiting_on_client", "resolved", "closed"],
    "waiting_on_client": ["in_progress", "resolved", "closed"],
    "resolved": ["closed", "in_progress"],  # Re-opened
    "closed": ["open"],  # Re-opened
}

# --- SLA Hour Targets (in business hours) ---
SLA_TARGETS: dict[str, dict[str, int]] = {
    "urgent": {"response": 2, "resolution": 8},
    "high": {"response": 4, "resolution": 24},
    "medium": {"response": 8, "resolution": 48},
    "low": {"response": 24, "resolution": 72},
}


# --- SLA Helper Function ---
def calculate_sla_due_time(
    start_dt: datetime,
    target_hours: int,
    db: Session,
) -> datetime:
    """Calculate SLA deadline by advancing through business hours, skipping weekends and agency holidays."""
    # Fetch settings from system_settings
    setting = db.query(SystemSetting).filter_by(key="agency_profile").first()
    working_start = time(9, 30)
    working_end = time(18, 30)
    holidays: list[str] = []

    if setting and setting.value:
        try:
            val = json.loads(setting.value)
            holidays = val.get("holidays", [])
            if "working_hours_start" in val:
                h, m = map(int, val["working_hours_start"].split(":"))
                working_start = time(h, m)
            if "working_hours_end" in val:
                h, m = map(int, val["working_hours_end"].split(":"))
                working_end = time(h, m)
        except (json.JSONDecodeError, KeyError, ValueError):
            pass

    current_dt = start_dt
    hours_remaining = float(target_hours)

    while hours_remaining > 0:
        # Skip weekends (Saturday=5, Sunday=6)
        if current_dt.weekday() in (5, 6):
            current_dt = (current_dt + timedelta(days=1)).replace(
                hour=working_start.hour, minute=working_start.minute, second=0, microsecond=0
            )
            continue

        # Skip holidays
        if current_dt.date().isoformat() in holidays:
            current_dt = (current_dt + timedelta(days=1)).replace(
                hour=working_start.hour, minute=working_start.minute, second=0, microsecond=0
            )
            continue

        current_time = current_dt.time()
        # If before work hours, advance to start of day
        if current_time < working_start:
            current_dt = current_dt.replace(
                hour=working_start.hour, minute=working_start.minute, second=0, microsecond=0
            )
            continue

        # If after work hours, advance to next day's start
        if current_time >= working_end:
            current_dt = (current_dt + timedelta(days=1)).replace(
                hour=working_start.hour, minute=working_start.minute, second=0, microsecond=0
            )
            continue

        # Available time in today's work shift
        shift_end_dt = current_dt.replace(
            hour=working_end.hour, minute=working_end.minute, second=0, microsecond=0
        )
        available_seconds = (shift_end_dt - current_dt).total_seconds()
        available_hours = available_seconds / 3600.0

        if hours_remaining <= available_hours:
            current_dt += timedelta(hours=hours_remaining)
            hours_remaining = 0.0
        else:
            hours_remaining -= available_hours
            current_dt = (current_dt + timedelta(days=1)).replace(
                hour=working_start.hour, minute=working_start.minute, second=0, microsecond=0
            )

    return current_dt


# --- Schemas ---
class TicketSummary(BaseModel):
    id: str
    ticket_number: str
    client_id: str
    client_name: str
    subject: str
    priority: str
    status: str
    assigned_to_name: str | None = None
    created_at: str


class CommentItem(BaseModel):
    id: str
    user_name: str
    user_type: str
    content: str
    is_internal: bool
    created_at: str


class TicketDetail(BaseModel):
    id: str
    ticket_number: str
    client_id: str
    client_name: str
    subject: str
    description: str
    priority: str
    status: str
    assigned_to_name: str | None = None
    created_at: str
    first_response_at: str | None = None
    resolved_at: str | None = None
    comments: list[CommentItem]


class SlaStatusResponse(BaseModel):
    ticket_id: str
    priority: str
    response_due_at: str
    resolution_due_at: str
    response_breached: bool
    resolution_breached: bool
    first_response_at: str | None = None
    resolved_at: str | None = None


class CreateTicketRequest(BaseModel):
    client_id: str | None = None  # Auto-inferred for portal users
    project_id: str | None = None
    subject: str
    description: str
    priority: str = "medium"


class AddCommentRequest(BaseModel):
    content: str
    is_internal: bool = False


class TicketTransitionRequest(BaseModel):
    to_status: str
    reason: str | None = None


class TicketAssignRequest(BaseModel):
    assigned_to_id: str


# --- Endpoints ---
@router.get("/tickets", response_model=ApiResponse[PaginatedData[TicketSummary]])
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    client_id: str | None = None,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List tickets with multi-tenant client isolation."""
    query = db.query(SupportTicket).filter(SupportTicket.is_deleted.is_(False))
    query = apply_scope(query, SupportTicket, scope, db)

    if client_id:
        query = query.filter(SupportTicket.client_id == client_id)

    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)

    total = query.count()
    tickets = (
        query.order_by(desc(SupportTicket.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for t in tickets:
        cl = db.query(Client).filter_by(id=t.client_id).first()
        assigned = (
            db.query(User).filter_by(id=t.assigned_to_id).first() if t.assigned_to_id else None
        )
        items.append(
            TicketSummary(
                id=t.id,
                ticket_number=t.ticket_number,
                client_id=t.client_id,
                client_name=cl.name if cl else "Unknown",
                subject=t.subject,
                priority=t.priority,
                status=t.status,
                assigned_to_name=assigned.full_name if assigned else None,
                created_at=t.created_at.isoformat(),
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


@router.get("/tickets/{ticket_id}", response_model=ApiResponse[TicketDetail])
def get_ticket_detail(
    ticket_id: str,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Get ticket detail and thread. Clients cannot see internal comments."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)
    assert_can_access(ticket, scope)

    cl = db.query(Client).filter_by(id=ticket.client_id).first()
    assigned = (
        db.query(User).filter_by(id=ticket.assigned_to_id).first()
        if ticket.assigned_to_id
        else None
    )

    # Filter out internal comments for client users
    comments_query = db.query(TicketComment).filter_by(ticket_id=ticket.id)
    if scope.user.user_type == "client":
        comments_query = comments_query.filter(TicketComment.is_internal.is_(False))

    comments = comments_query.order_by(TicketComment.created_at.asc()).all()
    comment_items = []
    for c in comments:
        u = db.query(User).filter_by(id=c.user_id).first()
        comment_items.append(
            CommentItem(
                id=c.id,
                user_name=u.full_name if u else "User",
                user_type=u.user_type if u else "internal",
                content=c.content,
                is_internal=c.is_internal,
                created_at=c.created_at.isoformat(),
            )
        )

    return ApiResponse(
        success=True,
        data=TicketDetail(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            client_id=ticket.client_id,
            client_name=cl.name if cl else "Unknown",
            subject=ticket.subject,
            description=ticket.description,
            priority=ticket.priority,
            status=ticket.status,
            assigned_to_name=assigned.full_name if assigned else None,
            created_at=ticket.created_at.isoformat(),
            first_response_at=ticket.first_response_at.isoformat()
            if ticket.first_response_at
            else None,
            resolved_at=ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            comments=comment_items,
        ),
    )


@router.get("/tickets/{ticket_id}/sla", response_model=ApiResponse[SlaStatusResponse])
def get_ticket_sla_status(
    ticket_id: str,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Compute business-hour SLA deadlines and check for breaches."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)
    assert_can_access(ticket, scope)

    targets = SLA_TARGETS.get(ticket.priority, SLA_TARGETS["medium"])
    response_due = calculate_sla_due_time(ticket.created_at, targets["response"], db)
    resolution_due = calculate_sla_due_time(ticket.created_at, targets["resolution"], db)

    now = datetime.now(UTC)
    response_breached = (
        (ticket.first_response_at > response_due)
        if ticket.first_response_at
        else (now > response_due and ticket.status != "closed")
    )
    resolution_breached = (
        (ticket.resolved_at > resolution_due)
        if ticket.resolved_at
        else (now > resolution_due and ticket.status != "closed")
    )

    return ApiResponse(
        success=True,
        data=SlaStatusResponse(
            ticket_id=ticket.id,
            priority=ticket.priority,
            response_due_at=response_due.isoformat(),
            resolution_due_at=resolution_due.isoformat(),
            response_breached=response_breached,
            resolution_breached=resolution_breached,
            first_response_at=ticket.first_response_at.isoformat()
            if ticket.first_response_at
            else None,
            resolved_at=ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        ),
    )


@router.post("/tickets", response_model=ApiResponse[str])
def create_ticket(
    payload: CreateTicketRequest,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Create a new support ticket."""
    target_client_id = scope.client_id if scope.user.user_type == "client" else payload.client_id
    if not target_client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Client ID is required."
        )

    t_count = db.query(SupportTicket).count() + 1
    ticket_number = f"TICK-{datetime.now(UTC).year}-{t_count:04d}"

    ticket = SupportTicket(
        ticket_number=ticket_number,
        client_id=target_client_id,
        project_id=payload.project_id,
        created_by_user_id=scope.user.id,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        priority=payload.priority.lower().strip(),
        status="open",
    )
    db.add(ticket)
    db.flush()

    log_audit_event(
        db=db,
        action="ticket.create",
        resource_type="ticket",
        resource_id=ticket.id,
        user=scope.user,
        new_values={"ticket_number": ticket.ticket_number, "subject": ticket.subject},
    )
    db.commit()
    db.refresh(ticket)

    return ApiResponse(
        success=True, data=ticket.id, message=f"Ticket #{ticket.ticket_number} created."
    )


@router.post("/tickets/{ticket_id}/transition", response_model=ApiResponse[bool])
def transition_ticket_status(
    ticket_id: str,
    payload: TicketTransitionRequest,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """State machine transition for support tickets."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)
    assert_can_access(ticket, scope)

    current_status = ticket.status
    target_status = payload.to_status.lower().strip()

    valid_targets = VALID_TICKET_TRANSITIONS.get(current_status, [])
    if target_status not in valid_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{target_status}'. Allowed transitions: {valid_targets}",
        )

    ticket.status = target_status
    if target_status == "resolved":
        ticket.resolved_at = datetime.now(UTC)
    elif target_status == "closed":
        if not ticket.resolved_at:
            ticket.resolved_at = datetime.now(UTC)
    elif target_status in ("open", "in_progress"):
        ticket.resolved_at = None

    log_audit_event(
        db=db,
        action="ticket.transition",
        resource_type="ticket",
        resource_id=ticket.id,
        user=scope.user,
        old_values={"status": current_status},
        new_values={"status": target_status, "reason": payload.reason},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=True,
        message=f"Ticket transitioned from {current_status} to {target_status}.",
    )


@router.post("/tickets/{ticket_id}/assign", response_model=ApiResponse[bool])
def assign_ticket(
    ticket_id: str,
    payload: TicketAssignRequest,
    scope: AccessScope = Depends(require_permission("support.manage")),
    db: Session = Depends(get_db),
):
    """Assign ticket to a staff member."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    user = db.query(User).filter_by(id=payload.assigned_to_id, is_active=True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff user not found.")

    ticket.assigned_to_id = user.id
    log_audit_event(
        db=db,
        action="ticket.assign",
        resource_type="ticket",
        resource_id=ticket.id,
        user=scope.user,
        new_values={"assigned_to_id": user.id, "assigned_to_name": user.full_name},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message=f"Ticket assigned to {user.full_name}.")


@router.post("/tickets/{ticket_id}/comments", response_model=ApiResponse[str])
def add_ticket_comment(
    ticket_id: str,
    payload: AddCommentRequest,
    scope: AccessScope = Depends(require_permission("support.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Add reply or internal staff note to a ticket thread."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)
    assert_can_access(ticket, scope)

    # Portal client cannot create internal comments
    is_internal = payload.is_internal if scope.user.user_type == "internal" else False

    comment = TicketComment(
        ticket_id=ticket.id,
        user_id=scope.user.id,
        content=payload.content.strip(),
        is_internal=is_internal,
    )
    db.add(comment)

    # Update ticket status:
    # 1. Staff responds to open ticket -> in_progress, record first_response_at
    if scope.user.user_type == "internal" and ticket.status == "open":
        ticket.status = "in_progress"
        if not ticket.first_response_at:
            ticket.first_response_at = datetime.now(UTC)

    # 2. Client responds to waiting_on_client ticket -> auto reopen to in_progress
    if scope.user.user_type == "client" and ticket.status == "waiting_on_client":
        ticket.status = "in_progress"

    db.commit()
    db.refresh(comment)

    return ApiResponse(success=True, data=comment.id, message="Comment posted.")
