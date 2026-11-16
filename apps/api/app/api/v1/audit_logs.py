"""Audit log query router for compliance and security forensics."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.database import get_db
from app.db.models.common import AuditLog
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


class AuditLogItem(BaseModel):
    id: str
    user_id: str | None = None
    user_email: str | None = None
    action: str
    resource_type: str
    resource_id: str
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    timestamp: str


@router.get("", response_model=ApiResponse[PaginatedData[AuditLogItem]])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user_id: str | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    scope: AccessScope = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db),
):
    """Retrieve immutable audit trail with filtering and pagination."""
    q = db.query(AuditLog)

    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if resource_id:
        q = q.filter(AuditLog.resource_id == resource_id)

    total = q.count()
    logs = q.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for log_item in logs:
        old_val = json.loads(log_item.old_values) if log_item.old_values else None
        new_val = json.loads(log_item.new_values) if log_item.new_values else None
        items.append(
            AuditLogItem(
                id=log_item.id,
                user_id=log_item.user_id,
                user_email=log_item.user_email,
                action=log_item.action,
                resource_type=log_item.resource_type,
                resource_id=log_item.resource_id,
                old_values=old_val,
                new_values=new_val,
                ip_address=log_item.ip_address,
                user_agent=log_item.user_agent,
                timestamp=log_item.timestamp.isoformat() if log_item.timestamp else datetime.now(UTC).isoformat(),
            )
        )

    import math

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return ApiResponse(
        success=True,
        data=PaginatedData(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages),
    )
