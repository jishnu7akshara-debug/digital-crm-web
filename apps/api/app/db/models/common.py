"""Common Models: Notifications, Immutable Audit Logs, File Assets, System Settings."""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, uuid_pk


class Notification(Base, TimestampMixin):
    """In-app notifications for users."""
    __tablename__ = "notifications"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    link_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notification_type: Mapped[str] = mapped_column(
        String(50), default="system", nullable=False
    )  # "project", "task", "invoice", "approval", "attendance", "system"
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """Immutable audit trail for high-security and financial operations."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g. "invoice.issue", "role.update"
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # e.g. "invoice", "role", "user"
    resource_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    old_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string
    new_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )


class FileAsset(Base, TimestampMixin):
    """Metadata for uploaded files stored in S3/R2 private storage."""
    __tablename__ = "file_assets"

    id: Mapped[str] = uuid_pk()
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    uploaded_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class SystemSetting(Base, TimestampMixin):
    """System configuration parameters."""
    __tablename__ = "system_settings"

    id: Mapped[str] = uuid_pk()
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)  # JSON or plain string
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
