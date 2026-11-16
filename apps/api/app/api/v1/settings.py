"""Agency settings router for organizational parameters, tax, and attendance rules."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import Organization
from app.db.models.common import SystemSetting
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/settings", tags=["Settings"])


class AgencySettingsResponse(BaseModel):
    org_id: str
    org_name: str
    slug: str
    gstin: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    invoice_prefix: str = "DF"
    fy_start_month: int = 4
    currency: str = "INR"
    working_hours_per_day: float = 8.0
    working_hours_start: str = "09:30"
    late_threshold_minutes: int = 15
    weekly_offs: list[str] = ["saturday", "sunday"]
    holidays: list[dict[str, str]] = []


class UpdateAgencySettingsRequest(BaseModel):
    org_name: str | None = None
    gstin: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    invoice_prefix: str | None = None
    fy_start_month: int | None = None
    working_hours_per_day: float | None = None
    working_hours_start: str | None = None
    late_threshold_minutes: int | None = None
    weekly_offs: list[str] | None = None
    holidays: list[dict[str, str]] | None = None


def _get_setting_val(db: Session, key: str, default: Any) -> Any:
    s = db.query(SystemSetting).filter_by(key=key).first()
    if not s:
        return default
    try:
        return json.loads(s.value)
    except Exception:
        return s.value


def _set_setting_val(db: Session, key: str, val: Any, desc: str | None = None) -> None:
    s = db.query(SystemSetting).filter_by(key=key).first()
    raw = json.dumps(val) if not isinstance(val, str) else val
    if s:
        s.value = raw
        if desc:
            s.description = desc
    else:
        db.add(SystemSetting(key=key, value=raw, description=desc, category="agency"))


@router.get("", response_model=ApiResponse[AgencySettingsResponse])
def get_agency_settings(
    scope: AccessScope = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db),
):
    """Retrieve full organizational configuration, tax parameters, and business rules."""
    org = db.query(Organization).first()
    if not org:
        org = Organization(
            id="default", name="Digital Footprint Solutions", slug="digital-footprint"
        )
        db.add(org)
        db.commit()

    return ApiResponse(
        success=True,
        data=AgencySettingsResponse(
            org_id=org.id,
            org_name=org.name,
            slug=org.slug,
            gstin=org.gstin or "29AABCU9603R1ZM",
            address=org.address or "Bangalore, Karnataka, India",
            phone=org.phone or "+91 98765 43210",
            email=org.email or "hello@digitalfootprint.in",
            invoice_prefix=_get_setting_val(db, "invoice_prefix", "DF"),
            fy_start_month=_get_setting_val(db, "fy_start_month", 4),
            currency=_get_setting_val(db, "currency", "INR"),
            working_hours_per_day=_get_setting_val(db, "working_hours_per_day", 8.0),
            working_hours_start=_get_setting_val(db, "working_hours_start", "09:30"),
            late_threshold_minutes=_get_setting_val(db, "late_threshold_minutes", 15),
            weekly_offs=_get_setting_val(db, "weekly_offs", ["saturday", "sunday"]),
            holidays=_get_setting_val(db, "holidays", []),
        ),
    )


@router.patch("", response_model=ApiResponse[AgencySettingsResponse])
def update_agency_settings(
    payload: UpdateAgencySettingsRequest,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Update organizational branding, GSTIN, and operational rules."""
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    old_vals: dict[str, Any] = {"org_name": org.name, "gstin": org.gstin}

    if payload.org_name is not None:
        org.name = payload.org_name.strip()
    if payload.gstin is not None:
        org.gstin = payload.gstin.strip().upper()
    if payload.address is not None:
        org.address = payload.address.strip()
    if payload.phone is not None:
        org.phone = payload.phone.strip()
    if payload.email is not None:
        org.email = payload.email.strip()

    if payload.invoice_prefix is not None:
        _set_setting_val(
            db, "invoice_prefix", payload.invoice_prefix.strip().upper(), "Invoice prefix code"
        )
    if payload.fy_start_month is not None:
        _set_setting_val(
            db, "fy_start_month", payload.fy_start_month, "Fiscal year start month (1-12)"
        )
    if payload.working_hours_per_day is not None:
        _set_setting_val(
            db, "working_hours_per_day", payload.working_hours_per_day, "Standard daily work hours"
        )
    if payload.working_hours_start is not None:
        _set_setting_val(
            db, "working_hours_start", payload.working_hours_start, "Work shift start time"
        )
    if payload.late_threshold_minutes is not None:
        _set_setting_val(
            db,
            "late_threshold_minutes",
            payload.late_threshold_minutes,
            "Late threshold in minutes",
        )
    if payload.weekly_offs is not None:
        _set_setting_val(db, "weekly_offs", payload.weekly_offs, "Weekly off days")
    if payload.holidays is not None:
        _set_setting_val(db, "holidays", payload.holidays, "Calendar holidays list")

    log_audit_event(
        db=db,
        action="settings.update",
        resource_type="organization",
        resource_id=org.id,
        old_values=old_vals,
        new_values={"org_name": org.name, "gstin": org.gstin},
        user=scope.user,
        request=request,
    )
    db.commit()

    return get_agency_settings(scope=scope, db=db)
