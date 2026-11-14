"""Support Ticketing API: Client Portal & Internal Desk with Strict Internal Note Privacy."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.crm import Client
from app.db.models.support import SupportTicket, TicketComment
from app.policies.rbac import AccessScope, require_permission, verify_client_isolation

router = APIRouter(prefix="/support", tags=["Support Tickets"])


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
    comments: list[CommentItem]


class CreateTicketRequest(BaseModel):
    client_id: str | None = None  # Auto-inferred for portal users
    project_id: str | None = None
    subject: str
    description: str
    priority: str = "medium"


class AddCommentRequest(BaseModel):
    content: str
    is_internal: bool = False


@router.get("/tickets", response_model=ApiResponse[PaginatedData[TicketSummary]])
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    client_id: str | None = None,
    scope: AccessScope = Depends(require_permission("support.read")),
    db: Session = Depends(get_db),
):
    """List tickets with multi-tenant client isolation."""
    query = db.query(SupportTicket).filter(SupportTicket.is_deleted.is_(False))

    if scope.user.user_type == "client":
        query = query.filter(SupportTicket.client_id == scope.client_id)
    elif client_id:
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
    scope: AccessScope = Depends(require_permission("support.read")),
    db: Session = Depends(get_db),
):
    """Get ticket detail and thread. Clients cannot see internal comments."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)

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
            comments=comment_items,
        ),
    )


@router.post("/tickets", response_model=ApiResponse[str])
def create_ticket(
    payload: CreateTicketRequest,
    scope: AccessScope = Depends(require_permission("support.read")),
    db: Session = Depends(get_db),
):
    """Create a new support ticket."""
    target_client_id = scope.client_id if scope.user.user_type == "client" else payload.client_id
    if not target_client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Client ID is required."
        )

    t_count = db.query(SupportTicket).count() + 1
    ticket_number = f"TICK-{datetime.now().year}-{t_count:04d}"

    ticket = SupportTicket(
        ticket_number=ticket_number,
        client_id=target_client_id,
        project_id=payload.project_id,
        created_by_user_id=scope.user.id,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        priority=payload.priority,
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ApiResponse(
        success=True, data=ticket.id, message=f"Ticket #{ticket.ticket_number} created."
    )


@router.post("/tickets/{ticket_id}/comments", response_model=ApiResponse[str])
def add_ticket_comment(
    ticket_id: str,
    payload: AddCommentRequest,
    scope: AccessScope = Depends(require_permission("support.read")),
    db: Session = Depends(get_db),
):
    """Add reply or internal staff note to a ticket thread."""
    ticket = db.query(SupportTicket).filter_by(id=ticket_id, is_deleted=False).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

    verify_client_isolation(ticket.client_id, scope)

    # Portal client cannot create internal comments
    is_internal = payload.is_internal if scope.user.user_type == "internal" else False

    comment = TicketComment(
        ticket_id=ticket.id,
        user_id=scope.user.id,
        content=payload.content.strip(),
        is_internal=is_internal,
    )
    db.add(comment)

    # Update ticket status if currently waiting
    if scope.user.user_type == "internal" and ticket.status == "open":
        ticket.status = "in_progress"
        if not ticket.first_response_at:
            ticket.first_response_at = datetime.now(UTC)

    db.commit()
    db.refresh(comment)

    return ApiResponse(success=True, data=comment.id, message="Comment posted.")
