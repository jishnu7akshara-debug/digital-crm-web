"""Standalone Tasks API: Multi-Project Aggregation, Assignment, Filtering & N+1 Elimination (B-07)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.projects import Project, Task
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskItemOut(BaseModel):
    id: str
    project_id: str
    project_name: str
    client_id: str
    title: str
    description: str | None = None
    status: str
    priority: str
    owner_id: str | None = None
    owner_name: str | None = None
    estimated_hours: float
    logged_hours: float
    due_date: str | None = None
    completed_at: str | None = None
    is_client_visible: bool
    created_at: str


class CreateTaskRequest(BaseModel):
    project_id: str
    title: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"
    owner_id: str | None = None
    estimated_hours: float = Field(0.0, ge=0.0)
    due_date: datetime | None = None
    is_client_visible: bool = True


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    owner_id: str | None = None
    estimated_hours: float | None = None
    logged_hours: float | None = None
    due_date: datetime | None = None
    is_client_visible: bool | None = None


@router.get("", response_model=ApiResponse[PaginatedData[TaskItemOut]])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status_filter: str | None = None,
    priority: str | None = None,
    project_id: str | None = None,
    owner_id: str | None = None,
    scope: AccessScope = Depends(require_permission("tasks.read")),
    db: Session = Depends(get_db),
):
    """List tasks across all projects with filters, eliminating N+1 queries."""
    query = (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .filter(Task.is_deleted.is_(False), Project.is_deleted.is_(False))
    )

    if scope.user.user_type == "client" and scope.user.client_id:
        query = query.filter(
            Project.client_id == scope.user.client_id, Task.is_client_visible.is_(True)
        )

    if status_filter:
        if status_filter == "completed":
            query = query.filter(Task.status == "completed")
        elif status_filter == "pending":
            query = query.filter(Task.status != "completed")
        else:
            query = query.filter(Task.status == status_filter.lower())

    if priority:
        query = query.filter(Task.priority == priority.lower())
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if owner_id:
        query = query.filter(Task.owner_id == owner_id)

    total = query.count()
    tasks = (
        query.order_by(desc(Task.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    )

    items = []
    for t in tasks:
        proj = db.query(Project).filter_by(id=t.project_id).first()
        owner = db.query(User).filter_by(id=t.owner_id).first() if t.owner_id else None

        items.append(
            TaskItemOut(
                id=t.id,
                project_id=t.project_id,
                project_name=proj.name if proj else "Project",
                client_id=proj.client_id if proj else "",
                title=t.title,
                description=t.description,
                status=t.status,
                priority=t.priority,
                owner_id=t.owner_id,
                owner_name=owner.full_name if owner else None,
                estimated_hours=float(t.estimated_hours or 0.0),
                logged_hours=float(t.logged_hours or 0.0),
                due_date=t.due_date.isoformat() if t.due_date else None,
                completed_at=t.completed_at.isoformat() if t.completed_at else None,
                is_client_visible=t.is_client_visible,
                created_at=t.created_at.isoformat()
                if t.created_at
                else datetime.now(UTC).isoformat(),
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


@router.post("", response_model=ApiResponse[str])
def create_task(
    payload: CreateTaskRequest,
    scope: AccessScope = Depends(require_permission("tasks.create")),
    db: Session = Depends(get_db),
):
    """Create a new task under a project."""
    project = db.query(Project).filter_by(id=payload.project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    task = Task(
        project_id=project.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        status=payload.status.lower(),
        priority=payload.priority.lower(),
        owner_id=payload.owner_id or scope.user.id,
        estimated_hours=payload.estimated_hours,
        due_date=payload.due_date,
        is_client_visible=payload.is_client_visible,
    )
    db.add(task)
    db.flush()

    log_audit_event(
        db=db,
        action="task.create",
        resource_type="task",
        resource_id=task.id,
        user=scope.user,
        new_values={"title": task.title, "project_id": task.project_id},
    )
    db.commit()

    return ApiResponse(success=True, data=task.id, message="Task created successfully.")


@router.patch("/{task_id}", response_model=ApiResponse[str])
def update_task(
    task_id: str,
    payload: UpdateTaskRequest,
    scope: AccessScope = Depends(require_permission("tasks.edit")),
    db: Session = Depends(get_db),
):
    """Update task attributes, assignment, or logged hours."""
    task = db.query(Task).filter_by(id=task_id, is_deleted=False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    old_status = task.status
    if payload.title is not None:
        task.title = payload.title.strip()
    if payload.description is not None:
        task.description = payload.description.strip() if payload.description else None
    if payload.status is not None:
        task.status = payload.status.lower()
        if task.status == "completed" and old_status != "completed":
            task.completed_at = datetime.now(UTC)
    if payload.priority is not None:
        task.priority = payload.priority.lower()
    if payload.owner_id is not None:
        task.owner_id = payload.owner_id
    if payload.estimated_hours is not None:
        task.estimated_hours = payload.estimated_hours
    if payload.logged_hours is not None:
        task.logged_hours = payload.logged_hours
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.is_client_visible is not None:
        task.is_client_visible = payload.is_client_visible

    task.updated_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="task.update",
        resource_type="task",
        resource_id=task.id,
        user=scope.user,
        new_values={"status": task.status},
    )
    db.commit()

    return ApiResponse(success=True, data=task.id, message="Task updated successfully.")


@router.delete("/{task_id}", response_model=ApiResponse[str])
def delete_task(
    task_id: str,
    scope: AccessScope = Depends(require_permission("tasks.delete")),
    db: Session = Depends(get_db),
):
    """Soft delete task."""
    task = db.query(Task).filter_by(id=task_id, is_deleted=False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.is_deleted = True
    task.deleted_at = datetime.now(UTC)

    log_audit_event(
        db=db,
        action="task.delete",
        resource_type="task",
        resource_id=task.id,
        user=scope.user,
    )
    db.commit()

    return ApiResponse(success=True, data=task.id, message="Task archived successfully.")
