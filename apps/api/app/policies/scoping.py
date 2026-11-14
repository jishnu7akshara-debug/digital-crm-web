"""Unified Record-Level Scoping Engine for RBAC (B-12).

Translates resolved AccessScope into SQLAlchemy query filters and validates
direct record access across all business modules.
"""

from typing import Any, TypeVar

from fastapi import HTTPException, status
from sqlalchemy.orm import Query, Session

from app.db.models.auth import User
from app.db.models.crm import Client
from app.policies.rbac import AccessScope

T = TypeVar("T")


def apply_scope(
    query: Query[T],
    model: type[T],
    scope: AccessScope,
    db: Session | None = None,
) -> Query[T]:
    """Applies record-level access restrictions to a SQLAlchemy query based on resolved AccessScope."""
    # 1. Super Admin or "all" scope: unbounded access
    if scope.is_super_admin or scope.scope == "all":
        return query

    # 2. Client Portal User: strict client isolation
    if scope.user.user_type == "client" or scope.scope == "client":
        if not scope.client_id:
            return query.filter(False)

        if hasattr(model, "client_id"):
            return query.filter(getattr(model, "client_id") == scope.client_id)
        if model is Client:
            return query.filter(getattr(model, "id") == scope.client_id)
        return query.filter(False)

    # 3. "own" scope: records created by or belonging directly to the user
    if scope.scope == "own":
        if hasattr(model, "created_by_id"):
            return query.filter(getattr(model, "created_by_id") == scope.user.id)
        if hasattr(model, "user_id"):
            return query.filter(getattr(model, "user_id") == scope.user.id)
        if hasattr(model, "assigned_to_id"):
            return query.filter(getattr(model, "assigned_to_id") == scope.user.id)
        if hasattr(model, "manager_id"):
            return query.filter(getattr(model, "manager_id") == scope.user.id)
        return query

    # 4. "assigned" scope: records assigned to the user or managed by them
    if scope.scope == "assigned":
        if hasattr(model, "assigned_to_id"):
            return query.filter(getattr(model, "assigned_to_id") == scope.user.id)
        if hasattr(model, "manager_id"):
            return query.filter(getattr(model, "manager_id") == scope.user.id)
        if hasattr(model, "account_manager_id"):
            return query.filter(getattr(model, "account_manager_id") == scope.user.id)
        if hasattr(model, "client_id"):
            return query.join(Client, getattr(model, "client_id") == Client.id).filter(
                Client.account_manager_id == scope.user.id
            )
        return query

    # 5. "department" scope: records belonging to staff in the user's department
    if scope.scope == "department":
        if not scope.user.department_id:
            if hasattr(model, "assigned_to_id"):
                return query.filter(getattr(model, "assigned_to_id") == scope.user.id)
            return query

        if db and hasattr(model, "assigned_to_id"):
            dept_user_ids = [
                u[0]
                for u in db.query(User.id)
                .filter(User.department_id == scope.user.department_id)
                .all()
            ]
            return query.filter(getattr(model, "assigned_to_id").in_(dept_user_ids))
        return query

    return query


def assert_can_access(obj: Any, scope: AccessScope) -> None:
    """Verifies that an individual retrieved object satisfies the user's AccessScope.

    Raises HTTP 403 Forbidden if access violates scoping boundaries.
    """
    if scope.is_super_admin or scope.scope == "all":
        return

    # Client Portal isolation
    if scope.user.user_type == "client" or scope.scope == "client":
        obj_client_id = getattr(obj, "client_id", None)
        if obj_client_id is None and hasattr(obj, "id") and isinstance(obj, Client):
            obj_client_id = obj.id

        if not scope.client_id or obj_client_id != scope.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Record does not belong to your client organization.",
            )
        return

    # "own" scope check
    if scope.scope == "own":
        owned = False
        for attr in ("created_by_id", "user_id", "assigned_to_id", "manager_id"):
            if getattr(obj, attr, None) == scope.user.id:
                owned = True
                break
        if not owned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only access your own records.",
            )
        return

    # "assigned" scope check
    if scope.scope == "assigned":
        assigned = False
        for attr in ("assigned_to_id", "manager_id", "account_manager_id"):
            if getattr(obj, attr, None) == scope.user.id:
                assigned = True
                break
        if not assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Record is not assigned to you.",
            )
        return
