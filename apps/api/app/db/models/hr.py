"""HR & Operations Models: Departments, Employees, Attendance, Ledger-Based Leave, Timesheets."""
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, Date, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, SoftDeleteMixin, uuid_pk


class Department(Base, TimestampMixin, SoftDeleteMixin):
    """Company departments: Engineering, Design, Marketing, Sales, Finance, HR, Operations."""
    __tablename__ = "departments"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    head_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="department")


class Employee(Base, TimestampMixin, SoftDeleteMixin):
    """Employee record extending User with HR, payroll, and designation information."""
    __tablename__ = "employees"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    employment_type: Mapped[str] = mapped_column(
        String(30), default="full_time", nullable=False
    )  # "full_time", "intern", "contract", "part_time"
    joining_date: Mapped[date] = mapped_column(Date, nullable=False)
    exit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Restricted salary data (visible only to HR / Finance / Super Admin)
    monthly_salary_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    pan_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bank_ifsc: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="employees")
    attendance_records: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests: Mapped[List["LeaveRequest"]] = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")


class Attendance(Base, TimestampMixin):
    """Daily attendance punch records. Timestamps stored in UTC with Asia/Kolkata business rules."""
    __tablename__ = "attendance"

    id: Mapped[str] = uuid_pk()
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_in_utc: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out_utc: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(
        String(30), default="present", nullable=False, index=True
    )  # "present", "late", "half_day", "absent", "holiday", "leave", "weekend"
    working_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_missing_punch: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Correction workflow
    is_correction: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    original_check_in_utc: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    original_check_out_utc: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    correction_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    correction_status: Mapped[Optional[str]] = mapped_column(
        String(30), nullable=True
    )  # "pending", "approved", "rejected"
    approved_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")


class LeaveBalance(Base, TimestampMixin):
    """Aggregated leave balance snapshot per employee and leave type."""
    __tablename__ = "leave_balances"

    id: Mapped[str] = uuid_pk()
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "casual", "sick", "earned", "unpaid"
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_days: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    used_days: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    balance_days: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)


class LeaveLedger(Base, TimestampMixin):
    """Immutable transactional ledger for every leave credit, debit, or adjustment."""
    __tablename__ = "leave_ledger"

    id: Mapped[str] = uuid_pk()
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transaction_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # "monthly_credit", "debit_approved_leave", "adjustment", "carry_forward", "revocation"
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)
    days: Mapped[float] = mapped_column(Float, nullable=False)  # Positive for credit, negative for debit
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)  # E.g. LeaveRequest.id


class LeaveRequest(Base, TimestampMixin):
    """Employee leave application workflow."""
    __tablename__ = "leave_requests"

    id: Mapped[str] = uuid_pk()
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_count: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[Text] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False, index=True
    )  # "pending", "approved", "rejected", "cancelled"
    reviewed_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests")


class Timesheet(Base, TimestampMixin):
    """Employee project/task work logs."""
    __tablename__ = "timesheets"

    id: Mapped[str] = uuid_pk()
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Text] = mapped_column(Text, nullable=False)
    is_billable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

