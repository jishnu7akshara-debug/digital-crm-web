"""Projects & Tasks API: Workspaces, Milestones, Tasks, Deliverables, Approvals."""
from datetime import datetime, date, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.policies.rbac import require_permission, verify_client_isolation, AccessScope
from app.core.audit import log_audit_event
from app.api.schemas import ApiResponse, PaginatedData
from app.db.models.projects import Project, ProjectMember, Milestone, Task, TaskAssignee, Deliverable, Comment
from app.db.models.crm import Client
from app.db.models.auth import User

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectSummary(BaseModel):
    id: str
    name: str
    code: str
    client_id: str
    client_name: str
    status: str
    priority: str
    progress_percent: int
    due_date: Optional[str] = None
    manager_name: Optional[str] = None
    tasks_count: int
    completed_tasks_count: int


class MilestoneItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: str
    is_completed: bool
    order_index: int


class TaskItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    owner_name: Optional[str] = None
    estimated_hours: float
    logged_hours: float
    due_date: Optional[str] = None
    is_client_visible: bool
    milestone_id: Optional[str] = None


class DeliverableItem(BaseModel):
    id: str
    title: str
    file_url: str
    version: int
    status: str
    client_feedback: Optional[str] = None
    approved_at: Optional[str] = None


class ProjectWorkspaceDetail(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    client_id: str
    client_name: str
    status: str
    priority: str
    progress_percent: int
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    budget_rupees: float
    manager: Optional[Dict[str, str]] = None
    members: List[Dict[str, str]]
    milestones: List[MilestoneItem]
    tasks: List[TaskItem]
    deliverables: List[DeliverableItem]


class CreateProjectRequest(BaseModel):
    client_id: str
    name: str
    code: str
    description: Optional[str] = None
    priority: str = "medium"
    manager_id: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    budget_paise: int = 0


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    milestone_id: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    owner_id: Optional[str] = None
    estimated_hours: float = 0.0
    due_date: Optional[date] = None
    is_client_visible: bool = True


class UpdateTaskStatusRequest(BaseModel):
    status: str


class DeliverableApprovalRequest(BaseModel):
    status: str  # "approved" or "revision_requested"
    feedback: Optional[str] = None


@router.get("", response_model=ApiResponse[PaginatedData[ProjectSummary]])
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    client_id: Optional[str] = None,
    scope: AccessScope = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    """List projects with scoping, search, and progress metrics."""
    query = db.query(Project).filter(Project.is_deleted == False)

    # Scoping
    if scope.user.user_type == "client":
        query = query.filter(Project.client_id == scope.client_id)
    elif client_id:
        query = query.filter(Project.client_id == client_id)

    if scope.scope == "assigned":
        # Scoped to managed or member
        query = query.filter(Project.manager_id == scope.user.id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((Project.name.ilike(search_fmt)) | (Project.code.ilike(search_fmt)))
    if status_filter:
        query = query.filter(Project.status == status_filter)

    total = query.count()
    projects = (
        query.order_by(desc(Project.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for p in projects:
        cl = db.query(Client).filter_by(id=p.client_id).first()
        mgr = db.query(User).filter_by(id=p.manager_id).first() if p.manager_id else None
        tasks_count = db.query(Task).filter_by(project_id=p.id, is_deleted=False).count()
        completed_tasks_count = db.query(Task).filter_by(project_id=p.id, status="completed", is_deleted=False).count()

        items.append(
            ProjectSummary(
                id=p.id,
                name=p.name,
                code=p.code,
                client_id=p.client_id,
                client_name=cl.name if cl else "Unknown Client",
                status=p.status,
                priority=p.priority,
                progress_percent=p.progress_percent,
                due_date=p.due_date.isoformat() if p.due_date else None,
                manager_name=mgr.full_name if mgr else None,
                tasks_count=tasks_count,
                completed_tasks_count=completed_tasks_count,
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


@router.get("/{project_id}", response_model=ApiResponse[ProjectWorkspaceDetail])
def get_project_workspace(
    project_id: str,
    scope: AccessScope = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    """Retrieve full project workspace including milestones, tasks, and deliverables."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    verify_client_isolation(project.client_id, scope)

    cl = db.query(Client).filter_by(id=project.client_id).first()
    mgr = db.query(User).filter_by(id=project.manager_id).first() if project.manager_id else None

    # Milestones
    milestones = (
        db.query(Milestone)
        .filter_by(project_id=project.id, is_deleted=False)
        .order_by(Milestone.order_index.asc())
        .all()
    )
    milestone_items = [
        MilestoneItem(
            id=m.id,
            title=m.title,
            description=m.description,
            due_date=m.due_date.isoformat(),
            is_completed=m.is_completed,
            order_index=m.order_index,
        )
        for m in milestones
    ]

    # Tasks (filter client visible if user is client)
    task_query = db.query(Task).filter_by(project_id=project.id, is_deleted=False)
    if scope.user.user_type == "client":
        task_query = task_query.filter(Task.is_client_visible == True)

    tasks = task_query.order_by(Task.due_date.asc().nulls_last()).all()
    task_items = []
    for t in tasks:
        owner = db.query(User).filter_by(id=t.owner_id).first() if t.owner_id else None
        task_items.append(
            TaskItem(
                id=t.id,
                title=t.title,
                description=t.description,
                status=t.status,
                priority=t.priority,
                owner_name=owner.full_name if owner else None,
                estimated_hours=t.estimated_hours,
                logged_hours=t.logged_hours,
                due_date=t.due_date.isoformat() if t.due_date else None,
                is_client_visible=t.is_client_visible,
                milestone_id=t.milestone_id,
            )
        )

    # Deliverables
    deliverables = db.query(Deliverable).filter_by(project_id=project.id, is_deleted=False).all()
    deliverable_items = [
        DeliverableItem(
            id=d.id,
            title=d.title,
            file_url=d.file_url,
            version=d.version,
            status=d.status,
            client_feedback=d.client_feedback,
            approved_at=d.approved_at.isoformat() if d.approved_at else None,
        )
        for d in deliverables
    ]

    return ApiResponse(
        success=True,
        data=ProjectWorkspaceDetail(
            id=project.id,
            name=project.name,
            code=project.code,
            description=project.description,
            client_id=project.client_id,
            client_name=cl.name if cl else "Unknown",
            status=project.status,
            priority=project.priority,
            progress_percent=project.progress_percent,
            start_date=project.start_date.isoformat() if project.start_date else None,
            due_date=project.due_date.isoformat() if project.due_date else None,
            budget_rupees=round(project.budget_paise / 100.0, 2),
            manager={"id": mgr.id, "name": mgr.full_name, "email": mgr.email} if mgr else None,
            members=[],
            milestones=milestone_items,
            tasks=task_items,
            deliverables=deliverable_items,
        ),
    )


@router.post("", response_model=ApiResponse[str])
def create_project(
    payload: CreateProjectRequest,
    scope: AccessScope = Depends(require_permission("projects.create")),
    db: Session = Depends(get_db),
):
    """Create a new client project workspace."""
    existing = db.query(Project).filter_by(code=payload.code.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Project code '{payload.code}' already exists.")

    project = Project(
        client_id=payload.client_id,
        name=payload.name.strip(),
        code=payload.code.strip(),
        description=payload.description,
        status="planning",
        priority=payload.priority,
        manager_id=payload.manager_id or scope.user.id,
        start_date=payload.start_date,
        due_date=payload.due_date,
        budget_paise=payload.budget_paise,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_audit_event(
        db=db,
        action="project.create",
        resource_type="project",
        resource_id=project.id,
        user=scope.user,
        new_values={"name": project.name, "code": project.code},
    )

    return ApiResponse(success=True, data=project.id, message="Project workspace created.")


@router.post("/{project_id}/tasks", response_model=ApiResponse[str])
def create_project_task(
    project_id: str,
    payload: CreateTaskRequest,
    scope: AccessScope = Depends(require_permission("tasks.create")),
    db: Session = Depends(get_db),
):
    """Create a task inside a project."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    task = Task(
        project_id=project.id,
        milestone_id=payload.milestone_id,
        title=payload.title.strip(),
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        owner_id=payload.owner_id or scope.user.id,
        estimated_hours=payload.estimated_hours,
        due_date=payload.due_date,
        is_client_visible=payload.is_client_visible,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return ApiResponse(success=True, data=task.id, message="Task created.")


@router.put("/tasks/{task_id}/status", response_model=ApiResponse[bool])
def update_task_status(
    task_id: str,
    payload: UpdateTaskStatusRequest,
    scope: AccessScope = Depends(require_permission("tasks.edit")),
    db: Session = Depends(get_db),
):
    """Update task status (e.g. todo -> in_progress -> completed)."""
    task = db.query(Task).filter_by(id=task_id, is_deleted=False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.status = payload.status
    if payload.status == "completed":
        task.completed_at = datetime.now(timezone.utc)
    db.commit()

    return ApiResponse(success=True, data=True, message="Task status updated.")

