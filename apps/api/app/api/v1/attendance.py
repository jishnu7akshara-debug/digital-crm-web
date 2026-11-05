"""Attendance & Leave API: Asia/Kolkata Timezone Rules, Ledger-Based Leave, Corrections."""
from datetime import datetime, date, timezone, time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
import pytz

from app.core.config import settings
from app.core.database import get_db
from app.policies.rbac import require_permission, AccessScope
from app.core.audit import log_audit_event
from app.api.schemas import ApiResponse, PaginatedData
from app.db.models.hr import Employee, Attendance, LeaveBalance, LeaveLedger, LeaveRequest
from app.db.models.auth import User

router = APIRouter(prefix="/attendance", tags=["Attendance & Leave"])

KOLKATA_TZ = pytz.timezone(settings.APP_TIMEZONE)


class AttendanceRecordItem(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: str
    check_in_local: Optional[str] = None
    check_out_local: Optional[str] = None
    status: str
    working_minutes: int
    is_missing_punch: bool
    is_correction: bool
    correction_status: Optional[str] = None


class PunchResponse(BaseModel):
    punch_type: str  # "check_in" or "check_out"
    timestamp_local: str
    status: str
    working_minutes: int


class SubmitCorrectionRequest(BaseModel):
    attendance_id: str
    corrected_check_in: datetime  # ISO UTC
    corrected_check_out: Optional[datetime] = None
    reason: str


class ReviewCorrectionRequest(BaseModel):
    status: str  # "approved" or "rejected"


class ApplyLeaveRequest(BaseModel):
    leave_type: str  # "casual", "sick", "earned", "unpaid"
    start_date: date
    end_date: date
    days_count: float
    reason: str


class ReviewLeaveRequest(BaseModel):
    status: str  # "approved" or "rejected"
    rejection_reason: Optional[str] = None


def evaluate_attendance_status(check_in_dt: Optional[datetime], check_out_dt: Optional[datetime]) -> tuple[str, int, bool]:
    """Apply Asia/Kolkata rules: Late > 10:30, Half-day > 11:00 or < 7h, Absent < 4h."""
    if not check_in_dt:
        return "absent", 0, False

    # Convert UTC to Asia/Kolkata
    in_local = check_in_dt.astimezone(KOLKATA_TZ)
    working_mins = 0
    is_missing = False

    if check_out_dt:
        out_local = check_out_dt.astimezone(KOLKATA_TZ)
        working_mins = int((check_out_dt - check_in_dt).total_seconds() // 60)
    else:
        is_missing = True

    # Rule evaluation
    in_time = in_local.time()
    late_threshold = time(10, 30)
    half_day_threshold = time(11, 0)

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


@router.post("/punch", response_model=ApiResponse[PunchResponse])
def punch_attendance(
    scope: AccessScope = Depends(require_permission("attendance.punch")),
    db: Session = Depends(get_db),
):
    """Record employee check-in or check-out in UTC and evaluate Kolkata rules."""
    emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
    if not emp:
        # Create minimal employee record if not existing
        emp = Employee(
            user_id=scope.user.id,
            employee_code=f"EMP-{scope.user.first_name[:3].upper()}-01",
            designation="Team Member",
            employment_type="full_time",
            joining_date=date.today(),
            monthly_salary_paise=0,
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

    now_utc = datetime.now(timezone.utc)
    today_local = now_utc.astimezone(KOLKATA_TZ).date()

    att = db.query(Attendance).filter_by(employee_id=emp.id, date=today_local).first()

    if not att:
        # Check-In
        status_val, mins, missing = evaluate_attendance_status(now_utc, None)
        att = Attendance(
            employee_id=emp.id,
            date=today_local,
            check_in_utc=now_utc,
            status=status_val,
            working_minutes=0,
            is_missing_punch=True,
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        punch_type = "check_in"
    else:
        # Check-Out
        att.check_out_utc = now_utc
        status_val, mins, missing = evaluate_attendance_status(att.check_in_utc, now_utc)
        att.status = status_val
        att.working_minutes = mins
        att.is_missing_punch = False
        db.commit()
        punch_type = "check_out"

    local_str = now_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p")

    return ApiResponse(
        success=True,
        data=PunchResponse(
            punch_type=punch_type,
            timestamp_local=local_str,
            status=att.status,
            working_minutes=att.working_minutes,
        ),
        message=f"{punch_type.replace('_', ' ').title()} recorded at {local_str} ({att.status.upper()}).",
    )


@router.get("/records", response_model=ApiResponse[PaginatedData[AttendanceRecordItem]])
def list_attendance_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    scope: AccessScope = Depends(require_permission("attendance.read")),
    db: Session = Depends(get_db),
):
    """List attendance records scoped by user/team."""
    query = db.query(Attendance)

    if scope.scope == "own":
        emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
        else:
            query = query.filter(Attendance.id == "none")

    total = query.count()
    records = query.order_by(desc(Attendance.date)).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for r in records:
        e = db.query(Employee).filter_by(id=r.employee_id).first()
        u = db.query(User).filter_by(id=e.user_id).first() if e else None

        in_local = r.check_in_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if r.check_in_utc else None
        out_local = r.check_out_utc.astimezone(KOLKATA_TZ).strftime("%I:%M %p") if r.check_out_utc else None

        items.append(
            AttendanceRecordItem(
                id=r.id,
                employee_id=r.employee_id,
                employee_name=u.full_name if u else "Employee",
                date=r.date.isoformat(),
                check_in_local=in_local,
                check_out_local=out_local,
                status=r.status,
                working_minutes=r.working_minutes,
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


@router.post("/leave/request", response_model=ApiResponse[str])
def apply_leave(
    payload: ApplyLeaveRequest,
    scope: AccessScope = Depends(require_permission("attendance.punch")),
    db: Session = Depends(get_db),
):
    """Submit a leave application."""
    emp = db.query(Employee).filter_by(user_id=scope.user.id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee record not found.")

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

    return ApiResponse(success=True, data=leave_req.id, message="Leave request submitted for review.")


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")

    if leave_req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Request is already {leave_req.status}.")

    leave_req.status = payload.status
    leave_req.reviewed_by_id = scope.user.id
    leave_req.reviewed_at = datetime.now(timezone.utc)
    leave_req.rejection_reason = payload.rejection_reason

    if payload.status == "approved":
        # Transactional Ledger entry
        bal = (
            db.query(LeaveBalance)
            .filter_by(employee_id=leave_req.employee_id, leave_type=leave_req.leave_type, year=leave_req.start_date.year)
            .first()
        )
        if not bal:
            bal = LeaveBalance(
                employee_id=leave_req.employee_id,
                leave_type=leave_req.leave_type,
                year=leave_req.start_date.year,
                allocated_days=24.0,  # 2 days/month default
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

    return ApiResponse(success=True, data=True, message=f"Leave request marked as {payload.status}.")
