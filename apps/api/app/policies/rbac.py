"""RBAC Policy Engine & FastAPI Dependencies."""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_token
from app.db.models.auth import User, UserSession, Role, Permission, RolePermission, UserRole
from app.db.models.crm import ClientContact


@dataclass
class AccessScope:
    """Resolved access scope for a requested operation."""
    user: User
    permission: str
    scope: str  # "all", "department", "assigned", "own", "client"
    is_super_admin: bool
    client_id: Optional[str] = None  # Populated for client portal users


def get_current_session_token(request: Request) -> Optional[str]:
    """Retrieve session token from HTTP-only cookie or Authorization header."""
    cookie_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and authenticate the active user from session."""
    token = get_current_session_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    token_hash = hash_token(token)
    now = datetime.now(timezone.utc)

    # Query active session
    user_session = (
        db.query(UserSession)
        .filter(
            UserSession.token_hash == token_hash,
            UserSession.is_revoked == False,
            UserSession.expires_at > now,
        )
        .first()
    )

    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
        )

    user = db.query(User).filter(User.id == user_session.user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact administrator.",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is suspended. Access denied.",
        )

    return user


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency requiring Super Admin privileges."""
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required.",
        )
    return current_user


def require_permission(permission_code: str, module: Optional[str] = None) -> Callable:
    """FastAPI dependency factory enforcing granular RBAC and returning resolved AccessScope."""

    def _dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> AccessScope:
        # Super Admin bypass (scoped to organization, fully audited)
        if current_user.is_super_admin:
            return AccessScope(
                user=current_user,
                permission=permission_code,
                scope="all",
                is_super_admin=True,
            )

        # For portal users, fetch their client_id
        client_id = None
        if current_user.user_type == "client":
            contact = db.query(ClientContact).filter_by(user_id=current_user.id).first()
            if contact:
                client_id = contact.client_id

        # Query user's assigned roles
        user_roles = (
            db.query(UserRole)
            .filter(UserRole.user_id == current_user.id)
            .all()
        )
        role_ids = [ur.role_id for ur in user_roles]

        if not role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: No roles assigned. Required: {permission_code}",
            )

        # Query role permissions for the required permission code
        rps = (
            db.query(RolePermission)
            .join(Permission, RolePermission.permission_id == Permission.id)
            .filter(
                RolePermission.role_id.in_(role_ids),
                Permission.code == permission_code,
            )
            .all()
        )

        if not rps:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: Missing '{permission_code}'.",
            )

        # Resolve widest scope if user has multiple roles ("all" > "department" > "assigned" > "own" > "client")
        scope_hierarchy = {"all": 5, "department": 4, "assigned": 3, "own": 2, "client": 1}
        best_scope = max(rps, key=lambda rp: scope_hierarchy.get(rp.scope, 0)).scope

        return AccessScope(
            user=current_user,
            permission=permission_code,
            scope=best_scope,
            is_super_admin=False,
            client_id=client_id,
        )

    return _dependency


def verify_client_isolation(
    requested_client_id: str,
    access_scope: AccessScope,
) -> None:
    """Enforces strict multi-tenant client isolation."""
    if access_scope.is_super_admin:
        return

    if access_scope.user.user_type == "client":
        if access_scope.client_id != requested_client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cross-client access is strictly forbidden.",
            )
