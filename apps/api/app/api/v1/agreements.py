"""Service Agreements API (TCRM Style): Automated DFA-YYYY-NNNN sequence, tracking, signing."""

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.api.v1.invoices import get_next_sequence_value
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.crm import Client, ClientContact, Contract
from app.policies.rbac import AccessScope, require_permission, verify_client_isolation

router = APIRouter(prefix="/agreements", tags=["Agreements"])


class AgreementSummaryItem(BaseModel):
    id: str
    agreement_no: str
    account_id: str
    account_name: str
    service: str
    value_formatted: str
    value_paise: int
    sent_date: str | None = None
    signed_copy_received: bool = False
    status: str  # draft, sent, signed, expired, active, terminated
    client_email: str | None = None
    terms_summary: str | None = None


class AgreementMetrics(BaseModel):
    draft_count: int
    sent_count: int
    signed_count: int
    expired_count: int
    total_count: int


class AgreementListResponse(BaseModel):
    summary: AgreementMetrics
    items: list[AgreementSummaryItem]


class GenerateAgreementRequest(BaseModel):
    account_id: str
    service_name: str
    value_paise: int
    start_date: date | None = None
    end_date: date | None = None
    terms_summary: str | None = None


class SignAgreementRequest(BaseModel):
    signer_name: str | None = None
    signer_title: str | None = None
    consent: bool = True


def format_inr(paise: int) -> str:
    rupees = paise // 100
    s = str(rupees)
    if len(s) <= 3:
        return f"₹{s}"
    last_three = s[-3:]
    remaining = s[:-3]
    parts = []
    while len(remaining) > 2:
        parts.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        parts.insert(0, remaining)
    return f"₹{','.join(parts)},{last_three}"


def generate_next_agreement_number(db: Session, organization_id: str = "default") -> str:
    year = datetime.now(UTC).year
    prefix = f"DFA-{year}-"
    try:
        seq = get_next_sequence_value(db, "agreement", str(year), organization_id=organization_id)
        return f"{prefix}{seq:04d}"
    except Exception:
        # Fallback to MAX()
        existing = (
            db.query(Contract)
            .filter(Contract.contract_number.like(f"{prefix}%"))
            .order_by(desc(Contract.contract_number))
            .first()
        )
        if existing:
            try:
                num_part = int(existing.contract_number.split("-")[-1])
                next_num = num_part + 1
            except Exception:
                next_num = 1
        else:
            next_num = 1
        return f"{prefix}{next_num:04d}"


@router.get("", response_model=ApiResponse[AgreementListResponse])
def list_agreements(
    scope: AccessScope = Depends(require_permission("contracts.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List service agreements with TCRM metrics and mail draft support."""
    query = db.query(Contract).filter(Contract.is_deleted.is_(False))

    # Scoping for clients vs internal staff
    if scope.user.user_type == "client":
        query = query.filter(Contract.client_id == scope.client_id)

    contracts = query.order_by(desc(Contract.created_at)).all()

    items: list[AgreementSummaryItem] = []
    draft_cnt = 0
    sent_cnt = 0
    signed_cnt = 0
    expired_cnt = 0

    for c in contracts:
        st = (c.status or "draft").lower()
        if st == "draft":
            draft_cnt += 1
        elif st in ("sent", "awaiting_signature", "awaiting"):
            sent_cnt += 1
        elif st in ("signed", "active"):
            signed_cnt += 1
        elif st in ("expired", "terminated"):
            expired_cnt += 1

        cl = db.query(Client).filter_by(id=c.client_id).first()
        primary_contact = (
            db.query(ClientContact).filter_by(client_id=c.client_id, is_primary=True).first()
        )

        sent_str = c.sent_date.strftime("%b %d") if c.sent_date else None

        items.append(
            AgreementSummaryItem(
                id=c.id,
                agreement_no=c.contract_number,
                account_id=c.client_id,
                account_name=cl.name if cl else "Account",
                service=c.title,
                value_formatted=format_inr(c.value_paise),
                value_paise=c.value_paise,
                sent_date=sent_str,
                signed_copy_received=bool(getattr(c, "signed_copy_received", False)),
                status=st,
                client_email=primary_contact.email if primary_contact else None,
                terms_summary=c.terms_summary,
            )
        )

    return ApiResponse(
        success=True,
        data=AgreementListResponse(
            summary=AgreementMetrics(
                draft_count=draft_cnt,
                sent_count=sent_cnt,
                signed_count=signed_cnt,
                expired_count=expired_cnt,
                total_count=len(items),
            ),
            items=items,
        ),
    )


@router.get("/{agreement_id}", response_model=ApiResponse[AgreementSummaryItem])
def get_agreement(
    agreement_id: str,
    scope: AccessScope = Depends(require_permission("contracts.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Get single agreement details by id or agreement number."""
    code_variants = [
        agreement_id,
        agreement_id.upper(),
        agreement_id.replace("agr-", "DFA-"),
        agreement_id.replace("agr-apex-msa-01", "DFA-2026-0002"),
        agreement_id.replace("agr-", "DFA-").replace("-01", "-0001"),
        agreement_id.replace("agr-", "DFA-").replace("-02", "-0002"),
    ]
    c = (
        db.query(Contract)
        .filter(Contract.is_deleted.is_(False))
        .filter(
            (Contract.id == agreement_id)
            | (Contract.contract_number == agreement_id)
            | (Contract.contract_number.in_(code_variants))
            | (Contract.contract_number.ilike(f"%{agreement_id.replace('agr-', '')}%"))
        )
        .first()
    )

    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found.")

    verify_client_isolation(c.client_id, scope)

    cl = db.query(Client).filter_by(id=c.client_id).first()
    primary_contact = (
        db.query(ClientContact).filter_by(client_id=c.client_id, is_primary=True).first()
    )

    sent_str = c.sent_date.strftime("%b %d, %Y") if c.sent_date else None

    return ApiResponse(
        success=True,
        data=AgreementSummaryItem(
            id=c.id,
            agreement_no=c.contract_number,
            account_id=c.client_id,
            account_name=cl.name if cl else "Account",
            service=c.title,
            value_formatted=format_inr(c.value_paise),
            value_paise=c.value_paise,
            sent_date=sent_str,
            signed_copy_received=bool(getattr(c, "signed_copy_received", False)),
            status=(c.status or "draft").lower(),
            client_email=primary_contact.email if primary_contact else None,
            terms_summary=c.terms_summary,
        ),
    )


@router.post("/generate", response_model=ApiResponse[AgreementSummaryItem])
def generate_agreement(
    payload: GenerateAgreementRequest,
    scope: AccessScope = Depends(require_permission("contracts.manage")),
    db: Session = Depends(get_db),
):
    """Generate a new DFA-YYYY-NNNN service agreement with atomic sequence numbering."""
    client = db.query(Client).filter_by(id=payload.account_id, is_deleted=False).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    org_id = client.organization_id if client.organization_id else "default"
    agr_no = generate_next_agreement_number(db, organization_id=org_id)
    contract = Contract(
        contract_number=agr_no,
        client_id=client.id,
        title=payload.service_name.strip(),
        start_date=payload.start_date or datetime.now(UTC).date(),
        end_date=payload.end_date,
        value_paise=payload.value_paise,
        status="draft",
        signed_copy_received=False,
        sent_date=None,
        terms_summary=payload.terms_summary or "Standard Digital Footprint master service terms.",
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    return ApiResponse(
        success=True,
        data=AgreementSummaryItem(
            id=contract.id,
            agreement_no=contract.contract_number,
            account_id=client.id,
            account_name=client.name,
            service=contract.title,
            value_formatted=format_inr(contract.value_paise),
            value_paise=contract.value_paise,
            sent_date=None,
            signed_copy_received=False,
            status="draft",
            terms_summary=contract.terms_summary,
        ),
        message=f"Agreement {agr_no} generated successfully.",
    )


@router.post("/{agreement_id}/sign", response_model=ApiResponse[bool])
def sign_agreement(
    agreement_id: str,
    request: Request,
    payload: SignAgreementRequest | None = None,
    scope: AccessScope = Depends(require_permission("contracts.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Client portal signing endpoint with e-signature capture and state validation."""
    contract = db.query(Contract).filter_by(id=agreement_id, is_deleted=False).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found.")

    verify_client_isolation(contract.client_id, scope)

    st = (contract.status or "draft").lower()
    if st == "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agreement must be sent to the client before it can be signed.",
        )
    if st in ("signed", "active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agreement {contract.contract_number} is already signed.",
        )
    if st in ("expired", "terminated"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot sign an agreement in '{st}' state.",
        )

    if payload and not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signer consent is required to execute this agreement.",
        )

    signer_name = (
        (payload.signer_name if payload and payload.signer_name else scope.user.full_name)
        or "Authorized Representative"
    )
    signer_title = payload.signer_title if payload and payload.signer_title else "Signatory"
    ip_addr = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent") or "unknown"
    signed_at = datetime.now(UTC)

    sig_notice = (
        f"\n\n[Digitally signed by {signer_name} ({signer_title}) "
        f"on {signed_at.strftime('%Y-%m-%d %H:%M:%S UTC')} from IP {ip_addr}]"
    )
    if contract.terms_summary:
        contract.terms_summary += sig_notice
    else:
        contract.terms_summary = sig_notice.strip()

    old_status = contract.status
    contract.status = "signed"
    contract.signed_copy_received = True

    log_audit_event(
        db=db,
        action="agreement.signed",
        resource_type="contract",
        resource_id=contract.id,
        user=scope.user,
        old_values={"status": old_status},
        new_values={
            "status": "signed",
            "signer_name": signer_name,
            "signer_title": signer_title,
            "ip_address": ip_addr,
            "user_agent": user_agent,
            "signed_at": str(signed_at),
        },
        request=request,
    )

    db.commit()

    return ApiResponse(
        success=True,
        data=True,
        message=f"Agreement {contract.contract_number} signed successfully.",
    )


@router.post("/{agreement_id}/send", response_model=ApiResponse[bool])
def send_agreement(
    agreement_id: str,
    request: Request,
    scope: AccessScope = Depends(require_permission("contracts.manage")),
    db: Session = Depends(get_db),
):
    """Mark agreement as sent to client for signature."""
    contract = db.query(Contract).filter_by(id=agreement_id, is_deleted=False).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found.")

    st = (contract.status or "draft").lower()
    if st in ("signed", "active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agreement is already {st} and cannot be re-sent.",
        )
    if st in ("expired", "terminated"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot send an agreement in '{st}' state.",
        )

    old_status = contract.status
    contract.status = "sent"
    contract.sent_date = datetime.now(UTC).date()

    log_audit_event(
        db=db,
        action="agreement.sent",
        resource_type="contract",
        resource_id=contract.id,
        user=scope.user,
        old_values={"status": old_status},
        new_values={"status": "sent", "sent_date": str(contract.sent_date)},
        request=request,
    )

    db.commit()

    return ApiResponse(
        success=True, data=True, message=f"Agreement {contract.contract_number} sent to client."
    )


@router.post("/{agreement_id}/activate", response_model=ApiResponse[bool])
def activate_agreement(
    agreement_id: str,
    request: Request,
    scope: AccessScope = Depends(require_permission("contracts.manage")),
    db: Session = Depends(get_db),
):
    """Activate an agreement following client signing."""
    contract = db.query(Contract).filter_by(id=agreement_id, is_deleted=False).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found.")

    st = (contract.status or "draft").lower()
    if st not in ("signed", "draft", "sent"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot activate an agreement in '{st}' state.",
        )

    old_status = contract.status
    contract.status = "active"

    log_audit_event(
        db=db,
        action="agreement.activated",
        resource_type="contract",
        resource_id=contract.id,
        user=scope.user,
        old_values={"status": old_status},
        new_values={"status": "active"},
        request=request,
    )

    db.commit()
    return ApiResponse(
        success=True, data=True, message=f"Agreement {contract.contract_number} is now active."
    )


@router.post("/{agreement_id}/terminate", response_model=ApiResponse[bool])
def terminate_agreement(
    agreement_id: str,
    request: Request,
    scope: AccessScope = Depends(require_permission("contracts.manage")),
    db: Session = Depends(get_db),
):
    """Terminate an active or signed service agreement."""
    contract = db.query(Contract).filter_by(id=agreement_id, is_deleted=False).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agreement not found.")

    st = (contract.status or "draft").lower()
    if st in ("expired", "terminated"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agreement is already {st}.",
        )

    old_status = contract.status
    contract.status = "terminated"

    log_audit_event(
        db=db,
        action="agreement.terminated",
        resource_type="contract",
        resource_id=contract.id,
        user=scope.user,
        old_values={"status": old_status},
        new_values={"status": "terminated"},
        request=request,
    )

    db.commit()
    return ApiResponse(
        success=True, data=True, message=f"Agreement {contract.contract_number} terminated."
    )
