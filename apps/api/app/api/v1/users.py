"""User management router for staff accounts and RBAC role assignment."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.core.security import generate_secure_token, hash_password
from app.db.models.auth import Organization, Role, User, UserRole, UserSession
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/users", tags=["Users"])


class RoleSummary(BaseModel):
    id: str
    name: str
    code: str


class UserSummary(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: str | None = None
    user_type: str
    is_active: bool
    is_suspended: bool
    is_super_admin: bool
    department_id: str | None = None
    avatar_url: str | None = None
    roles: list[RoleSummary] = []


class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role_id: str
    phone: str | None = None
    department_id: str | None = None
    password: str | None = None


class UpdateUserRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    department_id: str | None = None
    avatar_url: str | None = None
    role_ids: list[str] | None = None


class InviteUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role_id: str
    department_id: str | None = None


def _format_user(u: User, db: Session) -> UserSummary:
    user_roles = (
        db.query(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == u.id)
        .all()
    )
    roles = [RoleSummary(id=r.id, name=r.name, code=r.code) for r in user_roles]
    return UserSummary(
        id=u.id,
        email=u.email,
        first_name=u.first_name,
        last_name=u.last_name,
        full_name=f"{u.first_name} {u.last_name}".strip(),
        phone=u.phone,
        user_type=u.user_type,
        is_active=u.is_active,
        is_suspended=u.is_suspended,
        is_super_admin=u.is_super_admin,
        department_id=u.department_id,
        avatar_url=u.avatar_url,
        roles=roles,
    )


@router.get("", response_model=ApiResponse[PaginatedData[UserSummary]])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    query: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    user_type: str | None = "internal",
    scope: AccessScope = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db),
):
    """List staff users with role assignments, search, and pagination."""
    q = db.query(User).filter(User.is_deleted.is_(False))

    if user_type:
        q = q.filter(User.user_type == user_type)
    if is_active is not None:
        q = q.filter(User.is_active.is_(is_active))
    if query:
        pattern = f"%{query.strip()}%"
        q = q.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
    if role:
        q = q.join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id)
        q = q.filter(or_(Role.code == role, Role.id == role))

    total = q.count()
    users = q.order_by(User.first_name.asc()).offset((page - 1) * page_size).limit(page_size).all()

    import math

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = [_format_user(u, db) for u in users]
    return ApiResponse(
        success=True,
        data=PaginatedData(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages),
    )


@router.post("", response_model=ApiResponse[UserSummary])
def create_user(
    payload: CreateUserRequest,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Create a new staff user and assign their initial role."""
    existing = db.query(User).filter_by(email=payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists.",
        )

    role = db.query(Role).filter(or_(Role.id == payload.role_id, Role.code == payload.role_id)).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified role not found.")

    org = db.query(Organization).first()
    org_id = org.id if org else "default"

    raw_password = payload.password or generate_secure_token(12)
    new_user = User(
        organization_id=org_id,
        email=payload.email.lower().strip(),
        hashed_password=hash_password(raw_password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        department_id=payload.department_id,
        user_type="internal",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    user_role = UserRole(user_id=new_user.id, role_id=role.id)
    db.add(user_role)

    log_audit_event(
        db=db,
        action="user.create",
        resource_type="user",
        resource_id=new_user.id,
        new_values={"email": new_user.email, "role": role.code},
        user=scope.user,
        request=request,
    )
    db.commit()

    return ApiResponse(success=True, data=_format_user(new_user, db))


@router.get("/{user_id}", response_model=ApiResponse[UserSummary])
def get_user_detail(
    user_id: str,
    scope: AccessScope = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db),
):
    """Get single user profile and assigned roles."""
    user = db.query(User).filter_by(id=user_id, is_deleted=False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return ApiResponse(success=True, data=_format_user(user, db))


@router.patch("/{user_id}", response_model=ApiResponse[UserSummary])
def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Update user personal details or role assignments."""
    user = db.query(User).filter_by(id=user_id, is_deleted=False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    old_vals: dict[str, Any] = {"first_name": user.first_name, "last_name": user.last_name}

    if payload.first_name is not None:
        user.first_name = payload.first_name.strip()
    if payload.last_name is not None:
        user.last_name = payload.last_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone.strip() if payload.phone else None
    if payload.department_id is not None:
        user.department_id = payload.department_id
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    if payload.role_ids is not None:
        # Replace role assignments
        db.query(UserRole).filter_by(user_id=user.id).delete()
        for r_id in payload.role_ids:
            role = db.query(Role).filter(or_(Role.id == r_id, Role.code == r_id)).first()
            if role:
                db.add(UserRole(user_id=user.id, role_id=role.id))

    log_audit_event(
        db=db,
        action="user.update",
        resource_type="user",
        resource_id=user.id,
        old_values=old_vals,
        new_values={"first_name": user.first_name, "last_name": user.last_name},
        user=scope.user,
        request=request,
    )
    db.commit()

    return ApiResponse(success=True, data=_format_user(user, db))


@router.post("/{user_id}/deactivate", response_model=ApiResponse[bool])
def deactivate_user(
    user_id: str,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Deactivate a user and revoke all active sessions immediately."""
    user = db.query(User).filter_by(id=user_id, is_deleted=False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == scope.user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate yourself.")

    user.is_active = False

    # Revoke all sessions
    db.query(UserSession).filter_by(user_id=user.id).update({"is_revoked": True})

    log_audit_event(
        db=db,
        action="user.deactivate",
        resource_type="user",
        resource_id=user.id,
        user=scope.user,
        request=request,
    )
    db.commit()

    return ApiResponse(success=True, data=True)


@router.post("/{user_id}/reactivate", response_model=ApiResponse[bool])
def reactivate_user(
    user_id: str,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Reactivate a previously deactivated user."""
    user = db.query(User).filter_by(id=user_id, is_deleted=False).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = True

    log_audit_event(
        db=db,
        action="user.reactivate",
        resource_type="user",
        resource_id=user.id,
        user=scope.user,
        request=request,
    )
    db.commit()

    return ApiResponse(success=True, data=True)


@router.post("/invite", response_model=ApiResponse[dict])
def invite_user(
    payload: InviteUserRequest,
    request: Request,
    scope: AccessScope = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    """Invite a new team member with an invitation token."""
    existing = db.query(User).filter_by(email=payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists.",
        )

    role = db.query(Role).filter(or_(Role.id == payload.role_id, Role.code == payload.role_id)).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified role not found.")

    org = db.query(Organization).first()
    org_id = org.id if org else "default"

    temp_password = generate_secure_token(16)
    invite_token = generate_secure_token(32)

    new_user = User(
        organization_id=org_id,
        email=payload.email.lower().strip(),
        hashed_password=hash_password(temp_password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        department_id=payload.department_id,
        user_type="internal",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    user_role = UserRole(user_id=new_user.id, role_id=role.id)
    db.add(user_role)

    log_audit_event(
        db=db,
        action="user.invite",
        resource_type="user",
        resource_id=new_user.id,
        new_values={"email": new_user.email, "role": role.code, "token": invite_token[:8] + "..."},
        user=scope.user,
        request=request,
    )
    db.commit()

    return ApiResponse(
        success=True,
        data={
            "user_id": new_user.id,
            "email": new_user.email,
            "invite_token": invite_token,
            "invite_url": f"/auth/accept-invite?token={invite_token}",
        },
    )
