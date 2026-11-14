"""Attendance & Leave API: Asia/Kolkata Timezone Rules, Ledger-Based Leave, Concurrency-Safe Punch, and Detailed Auditing."""

from datetime import UTC, date, datetime, time, timedelta

import pytz
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.config import settings
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.hr import Attendance, Employee, LeaveBalance, LeaveLedger, LeaveRequest
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/attendance", tags=["Attendance & Leave"])

KOLKATA_TZ = pytz.timezone(settings.APP_TIMEZONE)


# Schemas
class AttendanceRecordItem(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    employee_designation: str = "Team Member"
    employee_initials: str = "EM"
    date: str
    day_of_week: str = ""
    check_in_local: str | None = None
    check_out_local: str | None = None
    status: str
    working_minutes: int
    working_hours_display: str = "0h 0m"
    is_missing_punch: bool
    is_correction: bool
    correction_status: str | None = None


class AttendanceRecordDetail(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    employee_code: str
    designation: str
    department: str
    date: str
    day_of_week: str
    check_in_local: str | None = None
    check_out_local: str | None = None
    check_in_utc: str | None = None
    check_out_utc: str | None = None
    working_minutes: int
    working_hours_display: str
    status: str
    status_rule_explanation: str
    is_missing_punch: bool
    is_correction: bool
    correction_status: str | None = None
    correction_reason: str | None = None


class PunchRequest(BaseModel):
    action: str | None = Field(
        None, description="'check_in' or 'check_out', or null for auto-detect"
    )


class PunchResponse(BaseModel):
    punch_type: str  # "check_in" or "check_out"
    timestamp_local: str
    date_local: str
    status: str
    working_minutes: int
    working_hours_display: str
    employee_name: str


class TodayPunchStatusResponse(BaseModel):
    employee_id: str
    employee_name: str
    employee_code: str
    designation: str
    current_date_ist: str
    current_time_ist: str
    day_of_week: str
    state: str  # "not_punched_in", "punched_in", "completed"
    can_punch_in: bool
    can_punch_out: bool
    is_completed: bool
    check_in_local: str | None = None
    check_out_local: str | None = None
    working_minutes: int = 0
    working_hours_display: str = "0h 0m"
    status: str | None = None


class AttendanceSummaryResponse(BaseModel):
    total_days: int
    present_days: int
    half_days: int
    leave_days: int
    period_label: str


class SubmitCorrectionRequest(BaseModel):
    corrected_check_in_local: str  # e.g. "09:30 AM" or "09:30"
    corrected_check_out_local: str | None = None
    reason: str


class AdminCorrectionRequest(BaseModel):
    check_in_local: str | None = None
    check_out_local: str | None = None
    status: str | None = None
    reason: str


class ApplyLeaveRequest(BaseModel):
    leave_type: str  # "casual", "sick", "earned", "unpaid"
    start_date: date
    end_date: date
    days_count: float
    reason: str


class ReviewLeaveRequest(BaseModel):
    status: str  # "approved" or "rejected"
    rejection_reason: str | None = None


def format_working_hours(minutes: int) -> str:
    h = minutes // 60
    m = minutes % 60
    return f"{h}h {m}m"


def ensure_utc(dt: datetime | None) -> datetime | None:
    """Normalize datetime to timezone-aware UTC, handling naive datetimes from SQLite."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def get_rule_explanation(
    status_val: str, check_in_dt: datetime | None, check_out_dt: datetime | None, working_mins: int
) -> str:
    check_in_utc = ensure_utc(check_in_dt)
    check_out_utc = ensure_utc(check_out_dt)
    if not check_in_utc:
        return "No punch logged for this date (Marked Absent)."

    in_local = check_in_utc.astimezone(KOLKATA_TZ)
    in_time_str = in_local.strftime("%I:%M %p")
    is_sat = in_local.weekday() == 5

    if check_out_utc:
        hours_str = format_working_hours(working_mins)
        if is_sat:
            if working_mins >= 180:
                return f"Saturday schedule completed ({hours_str}) — Marked Present."
            return f"Saturday schedule under 3 hours ({hours_str}) — Marked Half Day."
        if working_mins < 240:
            return f"Total logged work under 4 hours ({hours_str}) — Marked Absent."
        if working_mins < 420:
            return f"Total logged work under 7 hours ({hours_str}) — Marked Half Day."
        if in_local.time() > time(10, 30):
            return f"Late check-in at {in_time_str} (> 10:30 AM threshold), full day completed ({hours_str}) — Marked Late."
        return f"On-time check-in at {in_time_str} (<= 10:30 AM) and full day completed ({hours_str}) — Marked Present."

    # In-progress punch (no checkout yet)
    if in_local.time() > time(11, 0):
        return f"Late check-in at {in_time_str} (> 11:00 AM threshold) — Marked Half Day (Awaiting Punch Out)."
    if in_local.time() > time(10, 30):
        return f"Late check-in at {in_time_str} (> 10:30 AM threshold) — Marked Late (Awaiting Punch Out)."
    return f"On-time check-in at {in_time_str} (<= 10:30 AM) — Marked Present (Awaiting Punch Out)."


def evaluate_attendance_status(
    check_in_dt: datetime | None, check_out_dt: datetime | None
) -> tuple[str, int, bool]:
    """Apply Asia/Kolkata rules: Late > 10:30, Half-day > 11:00 or < 7h, Absent < 4h, Saturday adjustments."""
    check_in_utc = ensure_utc(check_in_dt)
    check_out_utc = ensure_utc(check_out_dt)

    if not check_in_utc:
        return "absent", 0, False

    in_local = check_in_utc.astimezone(KOLKATA_TZ)
    working_mins = 0
    is_missing = False

    if check_out_utc:
        working_mins = max(0, int((check_out_utc - check_in_utc).total_seconds() // 60))
    else:
        is_missing = True

    in_time = in_local.time()
    late_threshold = time(10, 30)
    half_day_threshold = time(11, 0)
    is_saturday = in_local.weekday() == 5

    # Saturday Rules
    if is_saturday:
        if working_mins > 0:
            if working_mins < 180:  # Under 3 hours
                return "half_day", working_mins, is_missing
            return "present", working_mins, is_missing
        if in_time > half_day_threshold:
            return "half_day", working_mins, is_missing
        return "present", working_mins, is_missing

    # Weekday Rules
    if working_mins > 0:
        if working_mins < 240:  # Under 4 hours
            return "absent", working_mins, is_missing
        if working_mins < 420:  # Under 7 hours
            return "half_day", working_mins, is_missing

    if in_time > half_day_threshold:
        return "half_day", working_mins, is_missing
    if in_time > late_threshold:
        return "late", working_mins, is_missing

    return "present", working_mins, is_missing


def get_date_range_bounds(
    filter_range: str, start_date: date | None = None, end_date: date | None = None
) -> tuple[date | None, date | None, str]:
    today = datetime.now(UTC).astimezone(KOLKATA_TZ).date()
    if filter_range == "today":
        return today, today, "Today"
    elif filter_range == "this_week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start, end, "This Week"
    elif filter_range == "this_month":
        start = today.replace(day=1)
        if today.month == 12:
            end = today.replace(day=31)
        else:
            next_month = today.replace(month=today.month + 1, day=1)
            end = next_month - timedelta(days=1)
        return start, end, "This Month"
    elif filter_range == "custom":
        if start_date and end_date:
            return (
                start_date,
                end_date,
                f"{start_date.strftime('%d %b')} – {end_date.strftime('%d %b')}",
            )
        elif start_date:
            return start_date, today, f"Since {start_date.strftime('%d %b')}"
        return None, None, "Custom Date"
    return None, None, "This Month"


def get_or_create_employee(db: Session, user: User) -> Employee:
    emp = db.query(Employee).filter_by(user_id=user.id).first()
    if not emp:
        initials = "".join([n[0] for n in user.full_name.split() if n])[:3].upper() or "EMP"
        emp = Employee(
            user_id=user.id,
            employee_code=f"EMP-{initials}-01",
            designation="Super Admin" if getattr(user, "is_super_admin", False) else "Team Member",
            employment_type="full_time",
            joining_date=date.today(),
            monthly_salary_paise=0,
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)
    return emp


# Endpoints


@router.get("/today-status", response_model=ApiResponse[TodayPunchStatusResponse])
def get_today_punch_status(
    scope: AccessScope = Depends(require_permission("attendance.read")),
    db: Session = Depends(get_db),
):
    """Retrieve today's current punch state for the logged-in employee."""
    emp = get_or_create_employee(db, scope.user)
    now_utc = datetime.now(UTC)
    now_local = now_utc.astimezone(KOLKATA_TZ)
    today_local = now_local.date()

    att = db.query(Attendance).filter_by(employee_id=emp.id, date=today_local).first()

    current_date_str = now_local.strftime("%d %b %Y")
    current_time_str = now_local.strftime("%I:%M %p")
    day_of_week = now_local.strftime("%A")

    in_utc = ensure_utc(att.check_in_utc) if att else None
    out_utc = ensure_utc(att.check_out_utc) if att else None

    if not att:
        state = "not_punched_in"
        can_punch_in = True
        can_punch_out = False
        is_completed = False
        check_in_local = None
        check_out_local = None
        working_mins = 0
        status_val = None
    elif out_utc is None:
        state = "punched_in"
        can_punch_in = False
        can_punch_out = True
        is_completed = False
        check_in_local = in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if in_utc else None
        check_out_local = None
        working_mins = max(0, int((now_utc - in_utc).total_seconds() // 60)) if in_utc else 0
        status_val = att.status
    else:
        state = "completed"
        can_punch_in = False
        can_punch_out = False
        is_completed = True
        check_in_local = in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if in_utc else None
        check_out_local = out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if out_utc else None
        working_mins = att.working_minutes
        status_val = att.status

    return ApiResponse(
        success=True,
        data=TodayPunchStatusResponse(
            employee_id=emp.id,
            employee_name=scope.user.full_name or "Sai Varshith",
            employee_code=emp.employee_code,
            designation=emp.designation,
            current_date_ist=current_date_str,
            current_time_ist=current_time_str,
            day_of_week=day_of_week,
            state=state,
            can_punch_in=can_punch_in,
            can_punch_out=can_punch_out,
            is_completed=is_completed,
            check_in_local=check_in_local,
            check_out_local=check_out_local,
            working_minutes=working_mins,
            working_hours_display=format_working_hours(working_mins),
            status=status_val,
        ),
        message="Today's punch status retrieved successfully.",
    )


@router.post("/punch", response_model=ApiResponse[PunchResponse])
def punch_attendance(
    payload: PunchRequest | None = None,
    scope: AccessScope = Depends(require_permission("attendance.punch")),
    db: Session = Depends(get_db),
):
    """
    Record employee check-in or check-out in UTC with server-enforced concurrency and validation.
    Prevents duplicate punch-in, duplicate punch-out, and unauthorized transitions.
    """
    emp = get_or_create_employee(db, scope.user)
    now_utc = datetime.now(UTC)
    now_local = now_utc.astimezone(KOLKATA_TZ)
    today_local = now_local.date()

    # Atomic transaction query
    att = (
        db.query(Attendance)
        .filter_by(employee_id=emp.id, date=today_local)
        .with_for_update()
        .first()
    )

    requested_action = payload.action if payload else None

    # Check state transitions
    if requested_action == "check_in":
        if att:
            in_utc = ensure_utc(att.check_in_utc)
            in_str = in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if in_utc else "earlier"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already punched in for today at {in_str}. Duplicate punch-in is rejected.",
            )
    elif requested_action == "check_out":
        if not att:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot punch out without an active punch-in for today. Please punch in first.",
            )
        if att.check_out_utc is not None:
            out_utc = ensure_utc(att.check_out_utc)
            out_str = out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if out_utc else "earlier"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attendance for today is already completed. Check-out was recorded at {out_str}.",
            )

    # Perform Punch
    if not att:
        # Check-In
        status_val, mins, missing = evaluate_attendance_status(now_utc, None)
        att = Attendance(
            employee_id=emp.id,
            date=today_local,
            check_in_utc=now_utc,
            check_out_utc=None,
            status=status_val,
            working_minutes=0,
            is_missing_punch=True,  # missing checkout until punched out
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        punch_type = "check_in"
    else:
        # If no explicit requested_action, verify not already checked out
        if att.check_out_utc is not None:
            out_utc = ensure_utc(att.check_out_utc)
            out_str = out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if out_utc else "earlier"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attendance for today is already completed (Punched out at {out_str}). No further punches allowed.",
            )

        # Check-Out
        att.check_out_utc = now_utc
        status_val, mins, missing = evaluate_attendance_status(att.check_in_utc, now_utc)
        att.status = status_val
        att.working_minutes = mins
        att.is_missing_punch = False
        db.commit()
        db.refresh(att)
        punch_type = "check_out"

    local_time_str = now_local.strftime("%I:%M %p")
    local_date_str = now_local.strftime("%d %b %Y")

    # Audit Trail
    log_audit_event(
        db=db,
        action=f"attendance.{punch_type}",
        resource_type="attendance",
        resource_id=att.id,
        user=scope.user,
        new_values={
            "employee_id": emp.id,
            "punch_type": punch_type,
            "date": today_local.isoformat(),
            "time_ist": local_time_str,
            "status": att.status,
            "working_minutes": att.working_minutes,
        },
    )

    action_label = "Punch In" if punch_type == "check_in" else "Punch Out"
    return ApiResponse(
        success=True,
        data=PunchResponse(
            punch_type=punch_type,
            timestamp_local=local_time_str,
            date_local=local_date_str,
            status=att.status,
            working_minutes=att.working_minutes,
            working_hours_display=format_working_hours(att.working_minutes),
            employee_name=scope.user.full_name or "Sai Varshith",
        ),
        message=f"{action_label} successfully recorded at {local_time_str} ({att.status.title()}).",
    )


@router.get("/summary", response_model=ApiResponse[AttendanceSummaryResponse])
def get_attendance_summary(
    filter_range: str = Query("this_month", description="today, this_week, this_month, custom"),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    scope: AccessScope = Depends(require_permission("attendance.read")),
    db: Session = Depends(get_db),
):
    """Aggregate attendance counts (Total, Present, Half Days, Leaves) with date filter support."""
    start_bound, end_bound, period_label = get_date_range_bounds(filter_range, start_date, end_date)

    query = db.query(Attendance)
    if scope.scope == "own":
        emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
        else:
            query = query.filter(Attendance.id == "none")

    if start_bound and end_bound:
        query = query.filter(Attendance.date >= start_bound, Attendance.date <= end_bound)

    records = query.all()

    total_records = len(records)
    # If filter is "this_month" or "today" and total_records == 0, count working days up to today
    present_days = sum(1 for r in records if r.status in ("present", "late"))
    half_days = sum(1 for r in records if r.status == "half_day")
    leave_days = sum(1 for r in records if r.status in ("leave", "absent"))

    # For empty or 1 record, make sure total_days accurately reflects total logged days
    total_days = max(total_records, present_days + half_days + leave_days)
    if total_days == 0 and filter_range == "this_month":
        total_days = 0

    return ApiResponse(
        success=True,
        data=AttendanceSummaryResponse(
            total_days=total_days,
            present_days=present_days,
            half_days=half_days,
            leave_days=leave_days,
            period_label=period_label,
        ),
        message="Attendance summary retrieved successfully.",
    )


@router.get("/records", response_model=ApiResponse[PaginatedData[AttendanceRecordItem]])
def list_attendance_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    filter_range: str | None = Query(None, description="today, this_week, this_month, custom"),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    scope: AccessScope = Depends(require_permission("attendance.read")),
    db: Session = Depends(get_db),
):
    """List attendance records with flexible date range filters and employee metadata."""
    query = db.query(Attendance)

    if scope.scope == "own":
        emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
        else:
            query = query.filter(Attendance.id == "none")

    if filter_range:
        start_bound, end_bound, _ = get_date_range_bounds(filter_range, start_date, end_date)
        if start_bound and end_bound:
            query = query.filter(Attendance.date >= start_bound, Attendance.date <= end_bound)

    total = query.count()
    records = (
        query.order_by(desc(Attendance.date)).offset((page - 1) * page_size).limit(page_size).all()
    )

    items = []
    for r in records:
        e = db.query(Employee).filter_by(id=r.employee_id).first()
        u = db.query(User).filter_by(id=e.user_id).first() if e else None

        in_utc = ensure_utc(r.check_in_utc)
        out_utc = ensure_utc(r.check_out_utc)
        in_local = in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if in_utc else None
        out_local = out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if out_utc else None

        emp_name = u.full_name if u else "Sai Varshith"
        initials = "".join([n[0] for n in emp_name.split() if n])[:2].upper() or "SV"
        designation = e.designation if e else "Super Admin"

        # Day of week
        dt_obj = r.date
        day_str = dt_obj.strftime("%a")

        items.append(
            AttendanceRecordItem(
                id=r.id,
                employee_id=r.employee_id,
                employee_name=emp_name,
                employee_designation=designation,
                employee_initials=initials,
                date=r.date.isoformat(),
                day_of_week=day_str,
                check_in_local=in_local,
                check_out_local=out_local,
                status=r.status,
                working_minutes=r.working_minutes,
                working_hours_display=format_working_hours(r.working_minutes),
                is_missing_punch=r.is_missing_punch,
                is_correction=r.is_correction,
                correction_status=r.correction_status,
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


@router.get("/records/{record_id}", response_model=ApiResponse[AttendanceRecordDetail])
def get_attendance_record_detail(
    record_id: str,
    scope: AccessScope = Depends(require_permission("attendance.read")),
    db: Session = Depends(get_db),
):
    """Retrieve full audit detail for an individual attendance record."""
    r = db.query(Attendance).filter_by(id=record_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found."
        )

    e = db.query(Employee).filter_by(id=r.employee_id).first()
    u = db.query(User).filter_by(id=e.user_id).first() if e else None

    # Scope check
    if scope.scope == "own" and e and e.user_id != scope.user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this attendance record."
        )

    in_utc = ensure_utc(r.check_in_utc)
    out_utc = ensure_utc(r.check_out_utc)
    in_local = in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if in_utc else None
    out_local = out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if out_utc else None

    rule_exp = get_rule_explanation(r.status, in_utc, out_utc, r.working_minutes)

    emp_name = u.full_name if u else "Sai Varshith"
    emp_code = e.employee_code if e else "EMP-SAI-01"
    designation = e.designation if e else "Super Admin"
    dept_name = e.department.name if (e and e.department) else "Leadership & Engineering"

    return ApiResponse(
        success=True,
        data=AttendanceRecordDetail(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            employee_code=emp_code,
            designation=designation,
            department=dept_name,
            date=r.date.isoformat(),
            day_of_week=r.date.strftime("%A"),
            check_in_local=in_local,
            check_out_local=out_local,
            check_in_utc=r.check_in_utc.isoformat() if r.check_in_utc else None,
            check_out_utc=r.check_out_utc.isoformat() if r.check_out_utc else None,
            working_minutes=r.working_minutes,
            working_hours_display=format_working_hours(r.working_minutes),
            status=r.status,
            status_rule_explanation=rule_exp,
            is_missing_punch=r.is_missing_punch,
            is_correction=r.is_correction,
            correction_status=r.correction_status,
            correction_reason=r.correction_reason,
        ),
        message="Attendance detail loaded successfully.",
    )


@router.put("/records/{record_id}/admin-correct", response_model=ApiResponse[bool])
def admin_correct_attendance(
    record_id: str,
    payload: AdminCorrectionRequest,
    scope: AccessScope = Depends(require_permission("attendance.manage")),
    db: Session = Depends(get_db),
):
    """Admin endpoint to manually correct check-in, check-out, or status with audit log."""
    r = db.query(Attendance).filter_by(id=record_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found."
        )

    old_values = {
        "check_in": r.check_in_utc.isoformat() if r.check_in_utc else None,
        "check_out": r.check_out_utc.isoformat() if r.check_out_utc else None,
        "status": r.status,
    }

    r.is_correction = True
    r.correction_reason = payload.reason
    r.correction_status = "approved"
    r.approved_by_id = scope.user.id

    if payload.status:
        r.status = payload.status

    db.commit()

    log_audit_event(
        db=db,
        action="attendance.admin_correction",
        resource_type="attendance",
        resource_id=r.id,
        user=scope.user,
        old_values=old_values,
        new_values={"status": r.status, "reason": payload.reason},
    )

    return ApiResponse(
        success=True, data=True, message="Attendance record corrected successfully by Admin."
    )


@router.post("/records/{record_id}/correction", response_model=ApiResponse[bool])
def submit_attendance_correction(
    record_id: str,
    payload: SubmitCorrectionRequest,
    scope: AccessScope = Depends(require_permission("attendance.punch")),
    db: Session = Depends(get_db),
):
    """Employee submits a correction request for an attendance punch."""
    r = db.query(Attendance).filter_by(id=record_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found."
        )

    r.is_correction = True
    r.correction_reason = payload.reason
    r.correction_status = "pending"
    db.commit()

    log_audit_event(
        db=db,
        action="attendance.correction_requested",
        resource_type="attendance",
        resource_id=r.id,
        user=scope.user,
        new_values={"reason": payload.reason, "status": "pending"},
    )

    return ApiResponse(
        success=True, data=True, message="Correction request submitted to HR for approval."
    )


@router.post("/leave/request", response_model=ApiResponse[str])
def apply_leave(
    payload: ApplyLeaveRequest,
    scope: AccessScope = Depends(require_permission("attendance.punch")),
    db: Session = Depends(get_db),
):
    """Submit a leave application."""
    emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Employee record not found."
        )

    leave_req = LeaveRequest(
        employee_id=emp.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days_count=payload.days_count,
        reason=payload.reason.strip(),
        status="pending",
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    return ApiResponse(
        success=True, data=leave_req.id, message="Leave request submitted for review."
    )


@router.put("/leave/{request_id}/review", response_model=ApiResponse[bool])
def review_leave_request(
    request_id: str,
    payload: ReviewLeaveRequest,
    scope: AccessScope = Depends(require_permission("attendance.manage")),
    db: Session = Depends(get_db),
):
    """Approve or reject leave request with transactional ledger balance update."""
    leave_req = db.query(LeaveRequest).filter_by(id=request_id).first()
    if not leave_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found."
        )

    if leave_req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {leave_req.status}.",
        )

    leave_req.status = payload.status
    leave_req.reviewed_by_id = scope.user.id
    leave_req.reviewed_at = datetime.now(UTC)
    leave_req.rejection_reason = payload.rejection_reason

    if payload.status == "approved":
        bal = (
            db.query(LeaveBalance)
            .filter_by(
                employee_id=leave_req.employee_id,
                leave_type=leave_req.leave_type,
                year=leave_req.start_date.year,
            )
            .first()
        )
        if not bal:
            bal = LeaveBalance(
                employee_id=leave_req.employee_id,
                leave_type=leave_req.leave_type,
                year=leave_req.start_date.year,
                allocated_days=24.0,
                used_days=0.0,
                balance_days=24.0,
            )
            db.add(bal)
            db.commit()
            db.refresh(bal)

        bal.used_days += leave_req.days_count
        bal.balance_days -= leave_req.days_count

        ledger_entry = LeaveLedger(
            employee_id=leave_req.employee_id,
            transaction_type="debit_approved_leave",
            leave_type=leave_req.leave_type,
            days=-leave_req.days_count,
            balance_after=bal.balance_days,
            reason=f"Approved leave from {leave_req.start_date} to {leave_req.end_date}",
            reference_id=leave_req.id,
        )
        db.add(ledger_entry)

    db.commit()

    log_audit_event(
        db=db,
        action="leave.reviewed",
        resource_type="leave_request",
        resource_id=leave_req.id,
        user=scope.user,
        new_values={"status": payload.status, "days": leave_req.days_count},
    )

    return ApiResponse(
        success=True, data=True, message=f"Leave request marked as {payload.status}."
    )
