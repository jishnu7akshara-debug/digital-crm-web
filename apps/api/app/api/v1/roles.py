"""Roles and Permissions Management API (Super Admin Enforced)."""

from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import Permission, Role, RolePermission, User, UserRole
from app.policies.rbac import require_super_admin

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])


class PermissionItem(BaseModel):
    id: str
    code: str
    module: str
    name: str
    description: str | None = None
    scope: str = "none"  # "all", "assigned", "own", "none"


class RoleDetail(BaseModel):
    id: str
    name: str
    code: str
    description: str | None = None
    is_system: bool
    role_type: str
    user_count: int
    permissions: list[PermissionItem]


class CreateRoleRequest(BaseModel):
    name: str
    code: str
    description: str | None = None
    role_type: str = "internal"  # "internal" or "client"
    permissions: dict[str, str] = Field(
        default_factory=dict
    )  # permission_id or code -> scope ("all", "assigned", "own")


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: dict[str, str] | None = None  # code -> scope ("all", "assigned", "own", "none")


class AssignRoleRequest(BaseModel):
    user_id: str
    role_ids: list[str]


class UserStatusUpdateRequest(BaseModel):
    is_active: bool | None = None
    is_suspended: bool | None = None


@router.get("", response_model=ApiResponse[list[RoleDetail]])
def list_roles(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """List all system and custom roles with associated permissions and member counts."""
    roles = db.query(Role).all()
    all_perms = db.query(Permission).all()

    # Batch query user counts per role
    user_counts = dict(
        db.query(UserRole.role_id, func.count(UserRole.id))
        .group_by(UserRole.role_id)
        .all()
    )

    # Batch query all role permissions
    all_rps = db.query(RolePermission).all()
    role_perm_map: dict[str, dict[str, str]] = defaultdict(dict)
    for rp in all_rps:
        role_perm_map[rp.role_id][rp.permission_id] = rp.scope

    result = []
    for r in roles:
        user_count = user_counts.get(r.id, 0)
        rp_map = role_perm_map.get(r.id, {})

        perm_items = [
            PermissionItem(
                id=p.id,
                code=p.code,
                module=p.module,
                name=p.name,
                description=p.description,
                scope=rp_map.get(p.id, "none"),
            )
            for p in all_perms
        ]

        result.append(
            RoleDetail(
                id=r.id,
                name=r.name,
                code=r.code,
                description=r.description,
                is_system=r.is_system,
                role_type=r.role_type,
                user_count=user_count,
                permissions=perm_items,
            )
        )

    return ApiResponse(success=True, data=result)


@router.get("/matrix/modules", response_model=ApiResponse[dict[str, list[dict[str, str]]]])
def get_permission_matrix_modules(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all system permissions grouped by module."""
    perms = db.query(Permission).order_by(Permission.module, Permission.code).all()
    grouped: dict[str, list[dict[str, str]]] = {}
    for p in perms:
        grouped.setdefault(p.module, []).append(
            {"id": p.id, "code": p.code, "name": p.name, "description": p.description or ""}
        )
    return ApiResponse(success=True, data=grouped)


@router.post("", response_model=ApiResponse[RoleDetail])
def create_custom_role(
    payload: CreateRoleRequest,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Create a new custom role with module-by-module permissions."""
    existing = db.query(Role).filter_by(code=payload.code.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with code '{payload.code}' already exists.",
        )

    role = Role(
        organization_id=current_admin.organization_id,
        name=payload.name.strip(),
        code=payload.code.strip().lower(),
        description=payload.description,
        is_system=False,
        role_type=payload.role_type,
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    # Attach permissions
    for p_key, scope in payload.permissions.items():
        if scope and scope != "none":
            perm = (
                db.query(Permission)
                .filter((Permission.id == p_key) | (Permission.code == p_key))
                .first()
            )
            if perm:
                rp = RolePermission(role_id=role.id, permission_id=perm.id, scope=scope)
                db.add(rp)
    log_audit_event(
        db=db,
        action="role.create",
        resource_type="role",
        resource_id=role.id,
        user=current_admin,
        new_values={"name": role.name, "code": role.code},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=RoleDetail(
            id=role.id,
            name=role.name,
            code=role.code,
            description=role.description,
            is_system=role.is_system,
            role_type=role.role_type,
            user_count=0,
            permissions=[],
        ),
        message="Role created successfully.",
    )


@router.put("/{role_id}", response_model=ApiResponse[bool])
def update_role(
    role_id: str,
    payload: UpdateRoleRequest,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Update role details and permissions."""
    role = db.query(Role).filter_by(id=role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

    old_values = {"name": role.name, "description": role.description}

    if payload.name:
        role.name = payload.name.strip()
    if payload.description is not None:
        role.description = payload.description

    if payload.permissions is not None:
        # Delete old permissions and insert updated
        db.query(RolePermission).filter_by(role_id=role.id).delete()
        for p_key, scope in payload.permissions.items():
            if scope and scope != "none":
                perm = (
                    db.query(Permission)
                    .filter((Permission.id == p_key) | (Permission.code == p_key))
                    .first()
                )
                if perm:
                    db.add(RolePermission(role_id=role.id, permission_id=perm.id, scope=scope))

    log_audit_event(
        db=db,
        action="role.update",
        resource_type="role",
        resource_id=role.id,
        user=current_admin,
        old_values=old_values,
        new_values={"name": role.name, "permissions": payload.permissions},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message="Role updated successfully.")


@router.delete("/{role_id}", response_model=ApiResponse[bool])
def delete_role(
    role_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Delete a custom role. System roles cannot be deleted."""
    role = db.query(Role).filter_by(id=role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System protected roles cannot be deleted.",
        )

    db.query(UserRole).filter_by(role_id=role.id).delete()
    db.query(RolePermission).filter_by(role_id=role.id).delete()
    db.delete(role)
    log_audit_event(
        db=db,
        action="role.delete",
        resource_type="role",
        resource_id=role_id,
        user=current_admin,
        old_values={"name": role.name, "code": role.code},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message="Role deleted.")


@router.post("/assign", response_model=ApiResponse[bool])
def assign_user_roles(
    payload: AssignRoleRequest,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Assign roles to a user. Prevents self-escalation and protecting the last Super Admin."""
    target_user = db.query(User).filter_by(id=payload.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Guard 1: Users cannot change their own roles
    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security rule: You cannot modify your own assigned roles.",
        )

    # Guard 2: The last Super Admin can never be removed or demoted
    if target_user.is_super_admin:
        super_admin_count = db.query(User).filter_by(is_super_admin=True, is_active=True).count()
        # Check if the target user is losing super admin
        super_role = db.query(Role).filter_by(code="super_admin").first()
        if super_role and super_role.id not in payload.role_ids and super_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation aborted: The last Super Admin cannot be removed or demoted.",
            )

    # Replace user roles
    db.query(UserRole).filter_by(user_id=target_user.id).delete()
    for rid in payload.role_ids:
        role = db.query(Role).filter_by(id=rid).first()
        if role:
            db.add(UserRole(user_id=target_user.id, role_id=role.id))

    log_audit_event(
        db=db,
        action="user.role_assignment",
        resource_type="user",
        resource_id=target_user.id,
        user=current_admin,
        new_values={"assigned_role_ids": payload.role_ids},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message="User roles updated successfully.")


@router.put("/users/{user_id}/status", response_model=ApiResponse[bool])
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Suspend or activate user account."""
    target_user = db.query(User).filter_by(id=user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot deactivate or suspend your own account.",
        )

    if payload.is_active is not None:
        target_user.is_active = payload.is_active
    if payload.is_suspended is not None:
        target_user.is_suspended = payload.is_suspended

    log_audit_event(
        db=db,
        action="user.status_update",
        resource_type="user",
        resource_id=target_user.id,
        user=current_admin,
        new_values={"is_active": target_user.is_active, "is_suspended": target_user.is_suspended},
    )
    db.commit()

    return ApiResponse(success=True, data=True, message="User status updated.")
