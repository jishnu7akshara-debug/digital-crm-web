"""Audit logging service for immutable security and financial records."""

import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.db.models.auth import User
from app.db.models.common import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str,
    user: User | None = None,
    old_values: dict[str, Any] | None = None,
    new_values: dict[str, Any] | None = None,
    request: Request | None = None,
) -> AuditLog:
    """Persist an immutable audit log entry."""
    ip_address = None
    user_agent = None

    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    log_entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        old_values=json.dumps(old_values) if old_values else None,
        new_values=json.dumps(new_values) if new_values else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log_entry)
    db.flush()
    return log_entry
