"""Team & HR Management API: Employee Roster, Departments, Designations & Profiles."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.core.security import hash_password
from app.db.models.auth import Role, User, UserRole
from app.db.models.hr import Department, Employee
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/team", tags=["Team & HR"])


class TeamMemberItem(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: str | None = None
    role: str
    department: str
    designation: str
    employee_code: str
    joining_date: str | None = None
    is_active: bool


class CreateTeamMemberRequest(BaseModel):
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str | None = None
    designation: str = Field(..., min_length=2)
    department_id: str | None = None
    role_id: str | None = None
    monthly_salary_paise: int = Field(0, ge=0)
    temporary_password: str = "Welcome@123"  # noqa: S105


@router.get("", response_model=ApiResponse[list[TeamMemberItem]])
def list_team_members(
    department_id: str | None = None,
    scope: AccessScope = Depends(require_permission("users.read")),
    db: Session = Depends(get_db),
):
    """List internal agency team members and employees."""
    query = (
        db.query(User)
        .filter(User.user_type == "internal", User.is_deleted.is_(False))
        .order_by(User.first_name)
    )

    users = query.all()
    items = []

    for u in users:
        emp = db.query(Employee).filter_by(user_id=u.id, is_deleted=False).first()
        dept = (
            db.query(Department).filter_by(id=emp.department_id).first()
            if emp and emp.department_id
            else None
        )
        ur = db.query(UserRole).filter_by(user_id=u.id).first()
        role = db.query(Role).filter_by(id=ur.role_id).first() if ur else None

        items.append(
            TeamMemberItem(
                id=emp.id if emp else u.id,
                user_id=u.id,
                name=u.full_name,
                email=u.email,
                phone=u.phone,
                role=role.name if role else ("Super Admin" if u.is_super_admin else "Staff Member"),
                department=dept.name if dept else "General Operations",
                designation=emp.designation if emp else "Agency Specialist",
                employee_code=emp.employee_code if emp else f"DF-{u.id[:4].upper()}",
                joining_date=emp.joining_date.isoformat() if emp and emp.joining_date else None,
                is_active=u.is_active,
            )
        )

    return ApiResponse(success=True, data=items)


@router.post("", response_model=ApiResponse[str])
def create_team_member(
    payload: CreateTeamMemberRequest,
    scope: AccessScope = Depends(require_permission("users.create")),
    db: Session = Depends(get_db),
):
    """Add a new staff member to the agency directory."""
    existing = db.query(User).filter_by(email=payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists.",
        )

    user = User(
        organization_id=scope.user.organization_id,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.temporary_password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        user_type="internal",
        is_active=True,
    )
    db.add(user)
    db.flush()

    # Assign role if provided
    if payload.role_id:
        ur = UserRole(user_id=user.id, role_id=payload.role_id)
        db.add(ur)

    # Create employee record
    emp_count = db.query(Employee).count() + 1
    emp_code = f"DF-EMP-{emp_count:04d}"

    emp = Employee(
        user_id=user.id,
        department_id=payload.department_id,
        employee_code=emp_code,
        designation=payload.designation.strip(),
        employment_type="full_time",
        joining_date=datetime.now(UTC).date(),
        monthly_salary_paise=payload.monthly_salary_paise,
    )
    db.add(emp)

    log_audit_event(
        db=db,
        action="team.create",
        resource_type="user",
        resource_id=user.id,
        user=scope.user,
        new_values={"email": user.email, "employee_code": emp_code},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=user.id,
        message=f"Team member '{user.full_name}' added successfully.",
    )
