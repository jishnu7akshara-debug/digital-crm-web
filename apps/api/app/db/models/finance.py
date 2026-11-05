"""Finance Models: Invoices, Line Items, Payments, Credit Notes (Indian GST, Integer Paise)."""
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, SoftDeleteMixin, uuid_pk


class Invoice(Base, TimestampMixin, SoftDeleteMixin):
    """Invoice entity with strict integer paise math and Indian GST compliance."""
    __tablename__ = "invoices"

    id: Mapped[str] = uuid_pk()
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    project_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    contract_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True
    )
    issue_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False, index=True
    )  # "draft", "issued", "paid", "partially_paid", "overdue", "cancelled"

    # All monetary amounts stored as integer paise (e.g. ₹1,000.00 = 100000 paise)
    subtotal_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    discount_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    cgst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    sgst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    igst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_tax_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    amount_paid_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    balance_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    gst_type: Mapped[str] = mapped_column(
        String(30), default="intra_state", nullable=False
    )  # "intra_state" (CGST+SGST), "inter_state" (IGST), "exempt"

    # Immutable client snapshot at time of invoice generation
    client_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    client_gstin_snapshot: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    client_address_snapshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    line_items: Mapped[List["InvoiceLineItem"]] = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice")
    credit_notes: Mapped[List["CreditNote"]] = relationship("CreditNote", back_populates="invoice")


class InvoiceLineItem(Base):
    """Line items for goods or services on an invoice."""
    __tablename__ = "invoice_line_items"

    id: Mapped[str] = uuid_pk()
    invoice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    hsn_sac_code: Mapped[str] = mapped_column(String(20), default="998314", nullable=False)  # Default IT consulting / software
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    tax_rate_percent: Mapped[int] = mapped_column(Integer, default=18, nullable=False)  # 18% standard GST
    tax_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="line_items")


class Payment(Base, TimestampMixin):
    """Idempotent payment transaction records."""
    __tablename__ = "payments"

    id: Mapped[str] = uuid_pk()
    payment_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    invoice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(50), default="bank_transfer", nullable=False
    )  # "bank_transfer", "upi", "card", "cheque", "cash"
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), default="completed", nullable=False
    )  # "completed", "pending", "failed", "refunded"
    recorded_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")


class CreditNote(Base, TimestampMixin):
    """Credit notes for invoice adjustments and refunds."""
    __tablename__ = "credit_notes"

    id: Mapped[str] = uuid_pk()
    credit_note_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    invoice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    issued_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="credit_notes")

