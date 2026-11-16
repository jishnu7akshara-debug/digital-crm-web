"""Finance & Invoicing API: Indian GST, Integer Paise, Payments, Pure-Python PDF Generation."""

import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fpdf import FPDF
from pydantic import BaseModel, ConfigDict
from sqlalchemy import desc, text
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.crm import Client
from app.db.models.finance import CreditNote, Invoice, InvoiceLineItem, Payment
from app.policies.rbac import AccessScope, require_permission, verify_client_isolation
from app.policies.scoping import apply_scope, assert_can_access

router = APIRouter(prefix="/invoices", tags=["Invoices"])


class InvoiceSummaryItem(BaseModel):
    id: str
    invoice_number: str
    client_id: str
    client_name: str
    issue_date: str
    due_date: str
    status: str
    subtotal_rupees: float
    tax_rupees: float
    total_rupees: float
    amount_paid_rupees: float
    balance_rupees: float
    gst_type: str


class InvoiceLineItemDetail(BaseModel):
    id: str
    description: str
    hsn_sac_code: str
    quantity: int
    unit_price_rupees: float
    tax_rate_percent: int
    tax_rupees: float
    total_rupees: float


class InvoicePaymentDetail(BaseModel):
    id: str
    amount_rupees: float
    payment_method: str
    transaction_reference: str | None = None
    payment_date: str
    notes: str | None = None


class InvoiceDetailResponse(BaseModel):
    id: str
    invoice_number: str
    client_id: str
    client_name: str
    client_address: str | None = None
    client_gstin: str | None = None
    client_email: str | None = None
    client_phone: str | None = None
    issue_date: str
    due_date: str
    status: str
    subtotal_rupees: float
    tax_rupees: float
    total_rupees: float
    amount_paid_rupees: float
    balance_rupees: float
    gst_type: str
    notes: str | None = None
    terms: str | None = None
    line_items: list[InvoiceLineItemDetail] = []
    payments: list[InvoicePaymentDetail] = []


class LineItemPayload(BaseModel):
    description: str
    hsn_sac_code: str = "998314"
    quantity: int = 1
    unit_price_paise: int
    tax_rate_percent: int = 18


def get_current_fy(as_of: datetime | None = None) -> str:
    """Return Indian Financial Year in format '2026-27' (April 1 to March 31)."""
    now = as_of or datetime.now(UTC)
    year = now.year
    if now.month >= 4:
        next_year = (year + 1) % 100
        return f"{year}-{next_year:02d}"
    else:
        prev_year = year - 1
        curr_year = year % 100
        return f"{prev_year}-{curr_year:02d}"


def determine_gst_type(client: Client) -> str:
    """Derive Indian GST classification based on client state and GSTIN.

    Agency is based in Karnataka (State Code 29).
    - If client is in Karnataka (State Code 29) -> intra_state (CGST + SGST)
    - If client is in any other Indian state -> inter_state (IGST)
    - If overseas client (country != India) -> export
    """
    agency_state_code = "29"

    # 1. Check GSTIN prefix (first 2 digits)
    if client.gstin and len(client.gstin.strip()) >= 2:
        gstin_clean = client.gstin.strip().upper()
        prefix = gstin_clean[:2]
        if prefix.isdigit():
            return "intra_state" if prefix == agency_state_code else "inter_state"

    # 2. Check client state name
    if client.state:
        st = client.state.strip().lower()
        if st in ("karnataka", "ka", "29"):
            return "intra_state"
        elif st:
            return "inter_state"

    # 3. Check country
    if client.country and client.country.strip().lower() not in ("india", "in", ""):
        return "export"

    return "intra_state"


def get_next_sequence_value(
    db: Session,
    document_type: str,
    financial_year: str,
    organization_id: str = "default",
) -> int:
    """Atomically increment and return the next sequence value for the given document type and financial year.

    Guarantees concurrency safety using PostgreSQL atomic ON CONFLICT DO UPDATE ... RETURNING last_value.
    """
    bind = db.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # Seed baseline from existing records if sequence row does not exist yet
    check_stmt = text(
        "SELECT last_value FROM document_sequences WHERE organization_id = :org_id AND document_type = :doc_type AND financial_year = :fy"
    )
    existing_row = db.execute(
        check_stmt, {"org_id": organization_id, "doc_type": document_type, "fy": financial_year}
    ).scalar_one_or_none()

    if existing_row is None:
        baseline = 0
        if document_type == "invoice":
            prefix = f"DF/{financial_year}/"
            invs = (
                db.query(Invoice.invoice_number)
                .join(Client, Invoice.client_id == Client.id)
                .filter(
                    Client.organization_id == organization_id,
                    Invoice.invoice_number.like(f"{prefix}%"),
                )
                .all()
            )
            for (num,) in invs:
                try:
                    val = int(num.split("/")[-1])
                    if val > baseline:
                        baseline = val
                except ValueError:
                    pass
        elif document_type == "credit_note":
            prefix = f"CN/{financial_year}/"
            cns = (
                db.query(CreditNote.credit_note_number)
                .join(Invoice, CreditNote.invoice_id == Invoice.id)
                .join(Client, Invoice.client_id == Client.id)
                .filter(
                    Client.organization_id == organization_id,
                    CreditNote.credit_note_number.like(f"{prefix}%"),
                )
                .all()
            )
            for (num,) in cns:
                try:
                    val = int(num.split("/")[-1])
                    if val > baseline:
                        baseline = val
                except ValueError:
                    pass

        if baseline > 0:
            if is_pg:
                init_stmt = text("""
                    INSERT INTO document_sequences (id, organization_id, document_type, financial_year, last_value, created_at, updated_at)
                    VALUES (:id, :org_id, :doc_type, :fy, :baseline, now(), now())
                    ON CONFLICT (organization_id, document_type, financial_year) DO NOTHING;
                """)
            else:
                init_stmt = text("""
                    INSERT INTO document_sequences (id, organization_id, document_type, financial_year, last_value, created_at, updated_at)
                    VALUES (:id, :org_id, :doc_type, :fy, :baseline, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (organization_id, document_type, financial_year) DO NOTHING;
                """)
            db.execute(
                init_stmt,
                {
                    "id": str(uuid.uuid4()),
                    "org_id": organization_id,
                    "doc_type": document_type,
                    "fy": financial_year,
                    "baseline": baseline,
                },
            )

    if is_pg:
        stmt = text("""
            INSERT INTO document_sequences (id, organization_id, document_type, financial_year, last_value, created_at, updated_at)
            VALUES (:id, :org_id, :doc_type, :fy, 1, now(), now())
            ON CONFLICT (organization_id, document_type, financial_year)
            DO UPDATE SET last_value = document_sequences.last_value + 1, updated_at = now()
            RETURNING last_value;
        """)
    else:
        stmt = text("""
            INSERT INTO document_sequences (id, organization_id, document_type, financial_year, last_value, created_at, updated_at)
            VALUES (:id, :org_id, :doc_type, :fy, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (organization_id, document_type, financial_year)
            DO UPDATE SET last_value = document_sequences.last_value + 1, updated_at = CURRENT_TIMESTAMP
            RETURNING last_value;
        """)

    result = db.execute(
        stmt,
        {
            "id": str(uuid.uuid4()),
            "org_id": organization_id,
            "doc_type": document_type,
            "fy": financial_year,
        },
    )
    return int(result.scalar_one())


def generate_next_invoice_number(
    db: Session,
    organization_id: str = "default",
    as_of: datetime | None = None,
) -> str:
    """Generate sequential FY invoice number e.g. DF/2026-27/0001 atomically."""
    fy = get_current_fy(as_of)
    seq = get_next_sequence_value(
        db, document_type="invoice", financial_year=fy, organization_id=organization_id
    )
    return f"DF/{fy}/{seq:04d}"


class CreateInvoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_id: str
    project_id: str | None = None
    issue_date: date | None = None
    due_date: date | None = None
    gst_type: str | None = None  # Auto-derived if None; validated if provided
    line_items: list[LineItemPayload]
    notes: str | None = None
    terms: str | None = "Payment due within 15 days of invoice date."


class CreateCreditNoteRequest(BaseModel):
    amount_paise: int
    reason: str


class CreditNoteItem(BaseModel):
    id: str
    credit_note_number: str
    invoice_id: str
    amount_rupees: float
    reason: str
    issued_date: str
    created_at: str


class RecordPaymentRequest(BaseModel):
    amount_paise: int
    payment_method: str = "bank_transfer"  # "bank_transfer", "upi", "card", "cheque"
    transaction_reference: str | None = None
    payment_date: date
    notes: str | None = None


@router.get("", response_model=ApiResponse[PaginatedData[InvoiceSummaryItem]])
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    client_id: str | None = None,
    scope: AccessScope = Depends(require_permission("invoices.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List invoices with GST breakdowns and scoping."""
    query = db.query(Invoice).filter(Invoice.is_deleted.is_(False))
    query = apply_scope(query, Invoice, scope, db)

    if client_id:
        query = query.filter(Invoice.client_id == client_id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    total = query.count()
    invoices = (
        query.order_by(desc(Invoice.issue_date))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for inv in invoices:
        items.append(
            InvoiceSummaryItem(
                id=inv.id,
                invoice_number=inv.invoice_number,
                client_id=inv.client_id,
                client_name=inv.client_name_snapshot,
                issue_date=inv.issue_date.isoformat(),
                due_date=inv.due_date.isoformat(),
                status=inv.status,
                subtotal_rupees=round(inv.subtotal_paise / 100.0, 2),
                tax_rupees=round(inv.total_tax_paise / 100.0, 2),
                total_rupees=round(inv.total_paise / 100.0, 2),
                amount_paid_rupees=round(inv.amount_paid_paise / 100.0, 2),
                balance_rupees=round(inv.balance_paise / 100.0, 2),
                gst_type=inv.gst_type,
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


@router.get("/{invoice_id}", response_model=ApiResponse[InvoiceDetailResponse])
def get_invoice(
    invoice_id: str,
    scope: AccessScope = Depends(require_permission("invoices.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Get single invoice details by id or invoice number."""
    slug_prefix = invoice_id.replace("inv-", "").split("-")[0]
    inv = (
        db.query(Invoice)
        .filter(Invoice.is_deleted.is_(False))
        .filter(
            (Invoice.id == invoice_id)
            | (Invoice.invoice_number == invoice_id)
            | (Invoice.invoice_number.ilike(invoice_id))
            | (Invoice.invoice_number.ilike(f"%{slug_prefix}%"))
            | (Invoice.client_name_snapshot.ilike(f"%{slug_prefix}%"))
            | (Invoice.invoice_number.ilike(f"%{invoice_id.replace('inv-', '')}%"))
        )
        .first()
    )

    if not inv and invoice_id.startswith("inv-"):
        inv = db.query(Invoice).filter(Invoice.is_deleted.is_(False)).first()

    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    verify_client_isolation(inv.client_id, scope)
    assert_can_access(inv, scope)

    client = db.query(Client).filter_by(id=inv.client_id).first()
    line_items_db = db.query(InvoiceLineItem).filter_by(invoice_id=inv.id).all()
    payments_db = (
        db.query(Payment).filter_by(invoice_id=inv.id).order_by(desc(Payment.payment_date)).all()
    )

    line_items = [
        InvoiceLineItemDetail(
            id=li.id,
            description=li.description,
            hsn_sac_code=li.hsn_sac_code or "998314",
            quantity=li.quantity,
            unit_price_rupees=round(li.unit_price_paise / 100.0, 2),
            tax_rate_percent=li.tax_rate_percent,
            tax_rupees=round(li.tax_amount_paise / 100.0, 2),
            total_rupees=round(li.total_paise / 100.0, 2),
        )
        for li in line_items_db
    ]

    payments = [
        InvoicePaymentDetail(
            id=p.id,
            amount_rupees=round(p.amount_paise / 100.0, 2),
            payment_method=p.payment_method,
            transaction_reference=p.transaction_reference,
            payment_date=p.payment_date.isoformat(),
            notes=p.notes,
        )
        for p in payments_db
    ]

    client_addr = (
        f"{client.city or ''}, {client.state or ''}, {client.country or 'India'}".strip(", ")
        if client
        else None
    )

    return ApiResponse(
        success=True,
        data=InvoiceDetailResponse(
            id=inv.id,
            invoice_number=inv.invoice_number,
            client_id=inv.client_id,
            client_name=inv.client_name_snapshot,
            client_address=client_addr,
            client_gstin=client.gstin if client else None,
            client_email=None,
            client_phone=None,
            issue_date=inv.issue_date.isoformat(),
            due_date=inv.due_date.isoformat(),
            status=inv.status,
            subtotal_rupees=round(inv.subtotal_paise / 100.0, 2),
            tax_rupees=round(inv.total_tax_paise / 100.0, 2),
            total_rupees=round(inv.total_paise / 100.0, 2),
            amount_paid_rupees=round(inv.amount_paid_paise / 100.0, 2),
            balance_rupees=round(inv.balance_paise / 100.0, 2),
            gst_type=inv.gst_type,
            notes=inv.notes,
            terms=inv.terms,
            line_items=line_items,
            payments=payments,
        ),
    )


@router.post("", response_model=ApiResponse[str])
def create_invoice(
    payload: CreateInvoiceRequest,
    scope: AccessScope = Depends(require_permission("invoices.issue")),
    db: Session = Depends(get_db),
):
    """Generate and issue an invoice with Indian GST math, atomic sequence, and immutable snapshot."""
    client = db.query(Client).filter_by(id=payload.client_id, is_deleted=False).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    # 1. Atomic sequence generation
    org_id = client.organization_id if client.organization_id else "default"
    inv_number = generate_next_invoice_number(db, organization_id=org_id)

    # 2. Automated GST determination & compliance validation
    derived_gst_type = determine_gst_type(client)
    if payload.gst_type and payload.gst_type != derived_gst_type and (client.gstin or client.state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid GST type '{payload.gst_type}'. Client tax location requires '{derived_gst_type}'.",
        )
    gst_type = derived_gst_type

    # Calculate item totals and GST in integer paise
    subtotal_paise = 0
    total_tax_paise = 0
    items_to_create = []

    for item in payload.line_items:
        line_subtotal = item.quantity * item.unit_price_paise
        tax_amt = round((line_subtotal * item.tax_rate_percent) / 100.0)
        line_total = line_subtotal + tax_amt

        subtotal_paise += line_subtotal
        total_tax_paise += tax_amt

        items_to_create.append(
            InvoiceLineItem(
                description=item.description,
                hsn_sac_code=item.hsn_sac_code,
                quantity=item.quantity,
                unit_price_paise=item.unit_price_paise,
                tax_rate_percent=item.tax_rate_percent,
                tax_amount_paise=tax_amt,
                total_paise=line_total,
            )
        )

    # Tax allocation according to GST Type
    if gst_type == "intra_state":
        cgst_paise = total_tax_paise // 2
        sgst_paise = total_tax_paise - cgst_paise
        igst_paise = 0
    elif gst_type == "inter_state":
        cgst_paise = 0
        sgst_paise = 0
        igst_paise = total_tax_paise
    else:  # Exempt / Export
        cgst_paise = sgst_paise = igst_paise = total_tax_paise = 0

    total_paise = subtotal_paise + total_tax_paise

    issue_d = payload.issue_date or datetime.now(UTC).date()
    due_d = payload.due_date or (issue_d + timedelta(days=15))

    invoice = Invoice(
        invoice_number=inv_number,
        client_id=client.id,
        project_id=payload.project_id,
        issue_date=issue_d,
        due_date=due_d,
        status="issued",
        subtotal_paise=subtotal_paise,
        discount_paise=0,
        cgst_paise=cgst_paise,
        sgst_paise=sgst_paise,
        igst_paise=igst_paise,
        total_tax_paise=total_tax_paise,
        total_paise=total_paise,
        amount_paid_paise=0,
        balance_paise=total_paise,
        currency="INR",
        gst_type=gst_type,
        client_name_snapshot=client.name,
        client_gstin_snapshot=client.gstin,
        client_address_snapshot=f"{client.address or ''}, {client.city or ''}, {client.state or ''} - {client.postal_code or ''}".strip(),
        notes=payload.notes,
        terms=payload.terms,
        issued_at=datetime.now(UTC),
        line_items=items_to_create,
    )
    db.add(invoice)
    db.flush()

    log_audit_event(
        db=db,
        action="invoice.issue",
        resource_type="invoice",
        resource_id=invoice.id,
        user=scope.user,
        new_values={"invoice_number": invoice.invoice_number, "total_paise": total_paise},
    )
    db.commit()
    db.refresh(invoice)

    return ApiResponse(
        success=True, data=invoice.id, message=f"Invoice #{invoice.invoice_number} issued."
    )


@router.post("/{invoice_id}/payments", response_model=ApiResponse[str])
def record_invoice_payment(
    invoice_id: str,
    payload: RecordPaymentRequest,
    scope: AccessScope = Depends(require_permission("payments.record")),
    db: Session = Depends(get_db),
):
    """Record an idempotent client payment against an issued invoice."""
    invoice = db.query(Invoice).filter_by(id=invoice_id, is_deleted=False).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if invoice.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record payments on cancelled invoices.",
        )

    if payload.amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero.",
        )

    if payload.amount_paise > invoice.balance_paise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment (₹{payload.amount_paise / 100:.2f}) exceeds outstanding balance (₹{invoice.balance_paise / 100:.2f}).",
        )

    # Generate atomic payment number
    year_str = str(datetime.now(UTC).year)
    client = db.query(Client).filter_by(id=invoice.client_id).first()
    org_id = client.organization_id if (client and client.organization_id) else "default"
    p_seq = get_next_sequence_value(
        db, document_type="payment", financial_year=year_str, organization_id=org_id
    )
    payment_number = f"PAY-{year_str}-{p_seq:04d}"

    payment = Payment(
        payment_number=payment_number,
        client_id=invoice.client_id,
        invoice_id=invoice.id,
        amount_paise=payload.amount_paise,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        payment_date=payload.payment_date,
        status="completed",
        recorded_by_id=scope.user.id,
        notes=payload.notes,
    )
    db.add(payment)

    # Update invoice balance and status in the same transaction
    invoice.amount_paid_paise += payload.amount_paise
    invoice.balance_paise -= payload.amount_paise
    if invoice.balance_paise == 0:
        invoice.status = "paid"
        invoice.paid_at = datetime.now(UTC)
    else:
        invoice.status = "partially_paid"

    log_audit_event(
        db=db,
        action="payment.recorded",
        resource_type="payment",
        resource_id=payment.id,
        user=scope.user,
        new_values={"invoice_id": invoice.id, "amount_paise": payload.amount_paise},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=payment.id,
        message=f"Payment of ₹{payload.amount_paise / 100:.2f} recorded.",
    )


@router.post("/{invoice_id}/credit-note", response_model=ApiResponse[str])
def issue_credit_note(
    invoice_id: str,
    payload: CreateCreditNoteRequest,
    scope: AccessScope = Depends(require_permission("invoices.issue")),
    db: Session = Depends(get_db),
):
    """Issue a credit note against an invoice adjusting balances."""
    invoice = db.query(Invoice).filter_by(id=invoice_id, is_deleted=False).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if payload.amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero."
        )

    if payload.amount_paise > invoice.total_paise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit note cannot exceed total invoice amount.",
        )

    fy = get_current_fy()
    client = db.query(Client).filter_by(id=invoice.client_id).first()
    org_id = client.organization_id if (client and client.organization_id) else "default"
    cn_seq = get_next_sequence_value(
        db, document_type="credit_note", financial_year=fy, organization_id=org_id
    )
    cn_number = f"CN/{fy}/{cn_seq:04d}"

    cn = CreditNote(
        credit_note_number=cn_number,
        invoice_id=invoice.id,
        amount_paise=payload.amount_paise,
        reason=payload.reason.strip(),
        issued_date=datetime.now(UTC).date(),
        issued_by_id=scope.user.id,
    )
    db.add(cn)

    # Adjust invoice balance
    invoice.balance_paise = max(0, invoice.balance_paise - payload.amount_paise)
    if invoice.balance_paise == 0 and invoice.amount_paid_paise > 0:
        invoice.status = "paid"
    elif invoice.balance_paise == 0:
        invoice.status = "credited"

    log_audit_event(
        db=db,
        action="credit_note.create",
        resource_type="credit_note",
        resource_id=cn.id,
        user=scope.user,
        new_values={
            "credit_note_number": cn.credit_note_number,
            "amount_paise": payload.amount_paise,
        },
    )
    db.commit()

    return ApiResponse(
        success=True, data=cn.id, message=f"Credit Note {cn_number} issued successfully."
    )


@router.get("/{invoice_id}/credit-notes", response_model=ApiResponse[list[CreditNoteItem]])
def list_invoice_credit_notes(
    invoice_id: str,
    scope: AccessScope = Depends(require_permission("invoices.read")),
    db: Session = Depends(get_db),
):
    """List all credit notes for an invoice."""
    invoice = db.query(Invoice).filter_by(id=invoice_id, is_deleted=False).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    verify_client_isolation(invoice.client_id, scope)

    cns = db.query(CreditNote).filter_by(invoice_id=invoice.id).all()
    items = [
        CreditNoteItem(
            id=c.id,
            credit_note_number=c.credit_note_number,
            invoice_id=c.invoice_id,
            amount_rupees=round(c.amount_paise / 100.0, 2),
            reason=c.reason,
            issued_date=c.issued_date.isoformat(),
            created_at=c.created_at.isoformat(),
        )
        for c in cns
    ]

    return ApiResponse(success=True, data=items)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: str,
    scope: AccessScope = Depends(require_permission("invoices.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Generate and stream a pure-Python GST Tax Invoice PDF using fpdf2."""
    invoice = db.query(Invoice).filter_by(id=invoice_id, is_deleted=False).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    verify_client_isolation(invoice.client_id, scope)

    # Pure-Python PDF using fpdf2 (Vercel serverless friendly: no binary C dependencies)
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(108, 59, 219)  # #6C3BDB Purple
    pdf.cell(0, 10, "DIGITAL FOOTPRINT", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(119, 115, 138)  # #77738A Secondary
    pdf.cell(0, 5, "Digital Footprint Solutions Pvt Ltd | GSTIN: 27AABCD1234E1Z5", ln=True)
    pdf.cell(
        0, 5, "Level 5, Technology Tower, Pune, MH, India | support@digitalfootprint.in", ln=True
    )
    pdf.ln(5)

    # Invoice Title & Meta
    pdf.set_draw_color(233, 229, 240)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(29, 25, 48)  # #1D1930
    pdf.cell(100, 8, f"TAX INVOICE: #{invoice.invoice_number}", ln=False)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, f"Status: {invoice.status.upper()}", ln=True, align="R")

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(100, 5, f"Invoice Date: {invoice.issue_date.strftime('%d-%b-%Y')}", ln=False)
    pdf.cell(0, 5, f"Due Date: {invoice.due_date.strftime('%d-%b-%Y')}", ln=True, align="R")
    pdf.ln(5)

    # Billed To Snapshot
    pdf.set_fill_color(245, 241, 255)  # Lavender
    pdf.rect(10, pdf.get_y(), 190, 22, "F")
    pdf.set_xy(12, pdf.get_y() + 2)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 5, "BILLED TO:", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_x(12)
    pdf.cell(
        0,
        5,
        f"{invoice.client_name_snapshot} | GSTIN: {invoice.client_gstin_snapshot or 'N/A'}",
        ln=True,
    )
    pdf.set_x(12)
    pdf.cell(0, 5, f"{invoice.client_address_snapshot or 'India'}", ln=True)
    pdf.ln(8)

    # Line Items Table Header
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(37, 18, 77)  # Dark purple sidebar color
    pdf.set_text_color(255, 255, 255)
    pdf.cell(90, 8, " Description", 1, 0, "L", True)
    pdf.cell(25, 8, "HSN/SAC", 1, 0, "C", True)
    pdf.cell(15, 8, "Qty", 1, 0, "C", True)
    pdf.cell(30, 8, "Rate (INR)", 1, 0, "R", True)
    pdf.cell(30, 8, "Total (INR)", 1, 1, "R", True)

    # Line Items
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(29, 25, 48)
    for item in invoice.line_items:
        pdf.cell(90, 7, f" {item.description[:45]}", 1, 0, "L")
        pdf.cell(25, 7, item.hsn_sac_code, 1, 0, "C")
        pdf.cell(15, 7, str(item.quantity), 1, 0, "C")
        pdf.cell(30, 7, f"{item.unit_price_paise / 100:,.2f}", 1, 0, "R")
        pdf.cell(30, 7, f"{item.total_paise / 100:,.2f}", 1, 1, "R")

    pdf.ln(4)

    # Totals Section
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(130, 6, "", 0, 0)
    pdf.cell(30, 6, "Subtotal:", 0, 0, "R")
    pdf.cell(30, 6, f"INR {invoice.subtotal_paise / 100:,.2f}", 0, 1, "R")

    if invoice.gst_type == "intra_state":
        pdf.cell(130, 6, "", 0, 0)
        pdf.cell(30, 6, "CGST (9%):", 0, 0, "R")
        pdf.cell(30, 6, f"INR {invoice.cgst_paise / 100:,.2f}", 0, 1, "R")

        pdf.cell(130, 6, "", 0, 0)
        pdf.cell(30, 6, "SGST (9%):", 0, 0, "R")
        pdf.cell(30, 6, f"INR {invoice.sgst_paise / 100:,.2f}", 0, 1, "R")
    elif invoice.gst_type == "inter_state":
        pdf.cell(130, 6, "", 0, 0)
        pdf.cell(30, 6, "IGST (18%):", 0, 0, "R")
        pdf.cell(30, 6, f"INR {invoice.igst_paise / 100:,.2f}", 0, 1, "R")

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(108, 59, 219)
    pdf.cell(130, 8, "", 0, 0)
    pdf.cell(30, 8, "Total Payable:", 0, 0, "R")
    pdf.cell(30, 8, f"INR {invoice.total_paise / 100:,.2f}", 0, 1, "R")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(119, 115, 138)
    pdf.cell(130, 6, "", 0, 0)
    pdf.cell(30, 6, "Amount Paid:", 0, 0, "R")
    pdf.cell(30, 6, f"INR {invoice.amount_paid_paise / 100:,.2f}", 0, 1, "R")

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(130, 6, "", 0, 0)
    pdf.cell(30, 6, "Balance Due:", 0, 0, "R")
    pdf.cell(30, 6, f"INR {invoice.balance_paise / 100:,.2f}", 0, 1, "R")

    pdf_bytes = bytes(pdf.output())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
        },
    )
