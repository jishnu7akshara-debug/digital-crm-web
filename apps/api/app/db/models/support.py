"""Support Ticketing Models: Tickets and Comments."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, uuid_pk


class SupportTicket(Base, TimestampMixin, SoftDeleteMixin):
    """Client support tickets with SLA and response tracking."""

    __tablename__ = "support_tickets"

    id: Mapped[str] = uuid_pk()
    ticket_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    assigned_to_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Text] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False, index=True
    )  # "low", "medium", "high", "urgent"
    status: Mapped[str] = mapped_column(
        String(30), default="open", nullable=False, index=True
    )  # "open", "in_progress", "waiting_on_client", "resolved", "closed"
    first_response_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    comments: Mapped[list["TicketComment"]] = relationship(
        "TicketComment", back_populates="ticket", cascade="all, delete-orphan"
    )


class TicketComment(Base, TimestampMixin):
    """Comments and internal agent notes on tickets."""

    __tablename__ = "ticket_comments"

    id: Mapped[str] = uuid_pk()
    ticket_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[Text] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # If true, visible to staff only; client cannot see!

    ticket: Mapped["SupportTicket"] = relationship("SupportTicket", back_populates="comments")
