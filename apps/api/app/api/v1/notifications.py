"""Notifications & File Storage API: User Alert Feeds and Uploads (F-10)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.common import Notification
from app.policies.rbac import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    link_url: str | None = None
    notification_type: str
    is_read: bool
    read_at: str | None = None
    created_at: str


class CreateNotificationRequest(BaseModel):
    user_id: str
    title: str = Field(..., min_length=2)
    message: str = Field(..., min_length=2)
    link_url: str | None = None
    notification_type: str = "system"


@router.get("", response_model=ApiResponse[list[NotificationItem]])
def list_my_notifications(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List unread and recent notifications for the logged in user."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .all()
    )

    items = [
        NotificationItem(
            id=n.id,
            title=n.title,
            message=n.message,
            link_url=n.link_url,
            notification_type=n.notification_type,
            is_read=n.is_read,
            read_at=n.read_at.isoformat() if n.read_at else None,
            created_at=n.created_at.isoformat() if n.created_at else datetime.now(UTC).isoformat(),
        )
        for n in notifs
    ]

    return ApiResponse(success=True, data=items)


@router.post("/{notification_id}/read", response_model=ApiResponse[bool])
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    notif.read_at = datetime.now(UTC)
    db.commit()

    return ApiResponse(success=True, data=True, message="Notification marked as read.")


@router.post("/read-all", response_model=ApiResponse[bool])
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all unread notifications as read for current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True, "read_at": datetime.now(UTC)})
    db.commit()

    return ApiResponse(success=True, data=True, message="All notifications marked as read.")
