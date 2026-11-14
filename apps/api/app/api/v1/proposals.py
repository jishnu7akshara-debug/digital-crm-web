"""Proposals & Opportunities API: Commercial Quotations, Scope Line Items and PDF/Acceptance (B-02, F-02)."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.crm import Client, Lead, Proposal, ProposalLineItem
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/proposals", tags=["Proposals & Opportunities"])


class ProposalLineItemIn(BaseModel):
    service_id: str | None = None
    description: str = Field(..., min_length=2)
    quantity: int = Field(1, ge=1)
    unit_price_paise: int = Field(..., ge=0)


class ProposalLineItemOut(BaseModel):
    id: str
    service_id: str | None = None
    description: str
    quantity: int
    unit_price_rupees: float
    total_rupees: float


class ProposalItem(BaseModel):
    id: str
    proposal_number: str
    client_id: str | None = None
    client_name: str | None = None
    lead_id: str | None = None
    lead_title: str | None = None
    title: str
    version: int
    status: str
    subtotal_rupees: float
    discount_rupees: float
    tax_rupees: float
    total_rupees: float
    valid_until: str | None = None
    accepted_at: str | None = None
    created_at: str


class ProposalDetail(ProposalItem):
    terms_and_conditions: str | None = None
    pdf_url: str | None = None
    line_items: list[ProposalLineItemOut] = []


class CreateProposalRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    client_id: str | None = None
    lead_id: str | None = None
    line_items: list[ProposalLineItemIn] = Field(..., min_length=1)
    discount_paise: int = Field(0, ge=0)
    tax_rate_percent: float = Field(18.0, ge=0.0)
    terms_and_conditions: str | None = None
    valid_until: datetime | None = None


class UpdateProposalRequest(BaseModel):
    title: str | None = None
    status: str | None = None
    terms_and_conditions: str | None = None
    discount_paise: int | None = Field(None, ge=0)
    valid_until: datetime | None = None


@router.get("", response_model=ApiResponse[PaginatedData[ProposalItem]])
def list_proposals(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status_filter: str | None = None,
    client_id: str | None = None,
    lead_id: str | None = None,
    scope: AccessScope = Depends(require_permission("proposals.read")),
    db: Session = Depends(get_db),
):
    """List proposals / deal opportunities."""
    query = db.query(Proposal).filter(Proposal.is_deleted.is_(False))

    if status_filter:
        query = query.filter(Proposal.status == status_filter.lower())
    if client_id:
        query = query.filter(Proposal.client_id == client_id)
    if lead_id:
        query = query.filter(Proposal.lead_id == lead_id)

    total = query.count()
    proposals = (
        query.order_by(desc(Proposal.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    )

    items = []
    for p in proposals:
        client = db.query(Client).filter_by(id=p.client_id).first() if p.client_id else None
        lead = db.query(Lead).filter_by(id=p.lead_id).first() if p.lead_id else None

        items.append(
            ProposalItem(
                id=p.id,
                proposal_number=p.proposal_number,
                client_id=p.client_id,
                client_name=client.name if client else None,
                lead_id=p.lead_id,
                lead_title=lead.title if lead else None,
                title=p.title,
                version=p.version,
                status=p.status,
                subtotal_rupees=round(p.subtotal_paise / 100.0, 2),
                discount_rupees=round(p.discount_paise / 100.0, 2),
                tax_rupees=round(p.tax_paise / 100.0, 2),
                total_rupees=round(p.total_paise / 100.0, 2),
                valid_until=p.valid_until.isoformat() if p.valid_until else None,
                accepted_at=p.accepted_at.isoformat() if p.accepted_at else None,
                created_at=p.created_at.isoformat() if p.created_at else datetime.now(UTC).isoformat(),
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


@router.get("/{proposal_id}", response_model=ApiResponse[ProposalDetail])
def get_proposal(
    proposal_id: str,
    scope: AccessScope = Depends(require_permission("proposals.read")),
    db: Session = Depends(get_db),
):
    """Get full proposal with line items and commercial breakdown."""
    p = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.is_deleted.is_(False)).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")

    client = db.query(Client).filter_by(id=p.client_id).first() if p.client_id else None
    lead = db.query(Lead).filter_by(id=p.lead_id).first() if p.lead_id else None

    line_items = (
        db.query(ProposalLineItem)
        .filter(ProposalLineItem.proposal_id == p.id)
        .all()
    )

    items_out = [
        ProposalLineItemOut(
            id=li.id,
            service_id=li.service_id,
            description=li.description,
            quantity=li.quantity,
            unit_price_rupees=round(li.unit_price_paise / 100.0, 2),
            total_rupees=round(li.total_paise / 100.0, 2),
        )
        for li in line_items
    ]

    return ApiResponse(
        success=True,
        data=ProposalDetail(
            id=p.id,
            proposal_number=p.proposal_number,
            client_id=p.client_id,
            client_name=client.name if client else None,
            lead_id=p.lead_id,
            lead_title=lead.title if lead else None,
            title=p.title,
            version=p.version,
            status=p.status,
            subtotal_rupees=round(p.subtotal_paise / 100.0, 2),
            discount_rupees=round(p.discount_paise / 100.0, 2),
            tax_rupees=round(p.tax_paise / 100.0, 2),
            total_rupees=round(p.total_paise / 100.0, 2),
            valid_until=p.valid_until.isoformat() if p.valid_until else None,
            accepted_at=p.accepted_at.isoformat() if p.accepted_at else None,
            created_at=p.created_at.isoformat() if p.created_at else datetime.now(UTC).isoformat(),
            terms_and_conditions=p.terms_and_conditions,
            pdf_url=p.pdf_url,
            line_items=items_out,
        ),
    )


@router.post("", response_model=ApiResponse[str])
def create_proposal(
    payload: CreateProposalRequest,
    scope: AccessScope = Depends(require_permission("proposals.create")),
    db: Session = Depends(get_db),
):
    """Create a new commercial quotation / proposal."""
    # Ensure either client or lead is provided
    if not payload.client_id and not payload.lead_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal must be linked to either a client or a lead.",
        )

    # Calculate subtotal from items
    subtotal_paise = sum(item.quantity * item.unit_price_paise for item in payload.line_items)
    discounted_subtotal = max(0, subtotal_paise - payload.discount_paise)
    tax_paise = round(discounted_subtotal * (payload.tax_rate_percent / 100.0))
    total_paise = discounted_subtotal + tax_paise

    # Generate sequential or unique proposal number
    count = db.query(Proposal).count() + 1
    proposal_number = f"PROP-{datetime.now(UTC).year}-{count:04d}"

    valid_until = payload.valid_until or (datetime.now(UTC) + timedelta(days=30))

    proposal = Proposal(
        proposal_number=proposal_number,
        client_id=payload.client_id,
        lead_id=payload.lead_id,
        title=payload.title.strip(),
        version=1,
        status="draft",
        subtotal_paise=subtotal_paise,
        discount_paise=payload.discount_paise,
        tax_paise=tax_paise,
        total_paise=total_paise,
        terms_and_conditions=payload.terms_and_conditions,
        valid_until=valid_until,
    )
    db.add(proposal)
    db.flush()

    for item in payload.line_items:
        line_item = ProposalLineItem(
            id=str(uuid4()),
            proposal_id=proposal.id,
            service_id=item.service_id,
            description=item.description.strip(),
            quantity=item.quantity,
            unit_price_paise=item.unit_price_paise,
            total_paise=item.quantity * item.unit_price_paise,
        )
        db.add(line_item)

    log_audit_event(
        db=db,
        action="proposal.create",
        resource_type="proposal",
        resource_id=proposal.id,
        user=scope.user,
        new_values={"proposal_number": proposal.proposal_number, "total_paise": total_paise},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=proposal.id,
        message=f"Proposal {proposal.proposal_number} created successfully.",
    )


@router.post("/{proposal_id}/status", response_model=ApiResponse[str])
def update_proposal_status(
    proposal_id: str,
    target_status: str = Query(..., description="draft, sent, accepted, rejected, expired"),
    scope: AccessScope = Depends(require_permission("proposals.update")),
    db: Session = Depends(get_db),
):
    """Transition proposal status (e.g. mark sent, accepted, rejected)."""
    p = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.is_deleted.is_(False)).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")

    target = target_status.lower()
    valid_statuses = {"draft", "sent", "accepted", "rejected", "expired"}
    if target not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{target}'. Must be one of {valid_statuses}",
        )

    old_status = p.status
    p.status = target
    if target == "accepted":
        p.accepted_at = datetime.now(UTC)

    p.updated_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="proposal.status_change",
        resource_type="proposal",
        resource_id=p.id,
        user=scope.user,
        old_values={"status": old_status},
        new_values={"status": target},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=p.status,
        message=f"Proposal status updated to '{target}'.",
    )


@router.delete("/{proposal_id}", response_model=ApiResponse[str])
def delete_proposal(
    proposal_id: str,
    scope: AccessScope = Depends(require_permission("proposals.delete")),
    db: Session = Depends(get_db),
):
    """Soft delete proposal."""
    p = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.is_deleted.is_(False)).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found.")

    p.is_deleted = True
    p.deleted_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="proposal.delete",
        resource_type="proposal",
        resource_id=p.id,
        user=scope.user,
    )
    db.commit()

    return ApiResponse(success=True, data=p.id, message="Proposal archived successfully.")
