"""Projects & Tasks API: Workspaces, State Machine, Milestones, Tasks, Deliverables, Approvals, Comments."""

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse, PaginatedData
from app.core.audit import log_audit_event
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.crm import Client
from app.db.models.projects import Comment, Deliverable, Milestone, Project, ProjectMember, Task
from app.policies.rbac import AccessScope, require_permission, verify_client_isolation
from app.policies.scoping import apply_scope, assert_can_access

router = APIRouter(prefix="/projects", tags=["Projects"])

# --- Valid State Machine Transitions ---
VALID_PROJECT_TRANSITIONS: dict[str, list[str]] = {
    "planning": ["in_progress", "on_hold", "cancelled"],
    "in_progress": ["internal_review", "client_review", "on_hold", "cancelled"],
    "internal_review": ["client_review", "in_progress", "on_hold"],
    "client_review": ["revision", "completed", "in_progress"],
    "revision": ["client_review", "in_progress", "cancelled"],
    "on_hold": ["planning", "in_progress", "cancelled"],
    "completed": ["in_progress"],  # Re-opened
    "cancelled": ["planning"],  # Re-opened
}


# --- Schemas ---
class ProjectSummary(BaseModel):
    id: str
    name: str
    code: str
    client_id: str
    client_name: str
    status: str
    priority: str
    progress_percent: int
    due_date: str | None = None
    manager_name: str | None = None
    tasks_count: int
    completed_tasks_count: int


class MilestoneItem(BaseModel):
    id: str
    title: str
    description: str | None = None
    due_date: str
    is_completed: bool
    order_index: int


class TaskItem(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: str
    priority: str
    owner_name: str | None = None
    estimated_hours: float
    logged_hours: float
    due_date: str | None = None
    is_client_visible: bool
    milestone_id: str | None = None


class DeliverableItem(BaseModel):
    id: str
    title: str
    file_url: str
    version: int
    status: str
    client_feedback: str | None = None
    approved_at: str | None = None


class MemberItem(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    project_role: str


class CommentItem(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    user_id: str
    user_name: str
    content: str
    is_internal: bool
    created_at: str


class ProjectWorkspaceDetail(BaseModel):
    id: str
    name: str
    code: str
    description: str | None = None
    client_id: str
    client_name: str
    status: str
    priority: str
    progress_percent: int
    start_date: str | None = None
    due_date: str | None = None
    budget_rupees: float
    manager: dict[str, str] | None = None
    members: list[MemberItem]
    milestones: list[MilestoneItem]
    tasks: list[TaskItem]
    deliverables: list[DeliverableItem]


class CreateProjectRequest(BaseModel):
    client_id: str
    name: str
    code: str
    description: str | None = None
    priority: str = "medium"
    manager_id: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    budget_paise: int = 0


class ProjectTransitionRequest(BaseModel):
    to_status: str
    reason: str | None = None


class CreateMilestoneRequest(BaseModel):
    title: str
    due_date: date
    description: str | None = None
    order_index: int = 0


class UpdateMilestoneRequest(BaseModel):
    title: str | None = None
    due_date: date | None = None
    description: str | None = None
    is_completed: bool | None = None
    order_index: int | None = None


class AddMemberRequest(BaseModel):
    user_id: str
    project_role: str = "contributor"  # "lead", "contributor", "reviewer", "client_viewer"


class CreateDeliverableRequest(BaseModel):
    title: str
    file_url: str
    task_id: str | None = None
    description: str | None = None


class CreateCommentRequest(BaseModel):
    entity_type: str = "project"  # "project", "task", "deliverable"
    entity_id: str
    content: str
    is_internal: bool = False


class CreateTaskRequest(BaseModel):
    title: str
    description: str | None = None
    milestone_id: str | None = None
    status: str = "todo"
    priority: str = "medium"
    owner_id: str | None = None
    estimated_hours: float = 0.0
    due_date: date | None = None
    is_client_visible: bool = True


class UpdateTaskStatusRequest(BaseModel):
    status: str


class DeliverableApprovalRequest(BaseModel):
    status: str  # "approved" or "revision_requested"
    feedback: str | None = None


def _recalculate_project_progress(project: Project, db: Session) -> None:
    """Helper to recalculate project progress percentage based on completed tasks and milestones."""
    tasks = db.query(Task).filter_by(project_id=project.id, is_deleted=False).all()
    milestones = db.query(Milestone).filter_by(project_id=project.id, is_deleted=False).all()

    total_units = len(tasks) + len(milestones)
    if total_units == 0:
        return

    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    completed_milestones = sum(1 for m in milestones if m.is_completed)

    project.progress_percent = round(((completed_tasks + completed_milestones) / total_units) * 100)


# --- Endpoints ---
@router.get("", response_model=ApiResponse[PaginatedData[ProjectSummary]])
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = None,
    client_id: str | None = None,
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List projects with scoping, search, and progress metrics."""
    query = db.query(Project).filter(Project.is_deleted.is_(False))
    query = apply_scope(query, Project, scope, db)

    if client_id:
        query = query.filter(Project.client_id == client_id)

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
        completed_tasks_count = (
            db.query(Task).filter_by(project_id=p.id, status="completed", is_deleted=False).count()
        )

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
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Retrieve full project workspace including members, milestones, tasks, and deliverables."""
    clean_code = project_id.replace("proj-", "PRJ-")
    slug_prefix = project_id.replace("proj-", "").split("-")[0]
    project = (
        db.query(Project)
        .filter(
            (
                (Project.id == project_id)
                | (Project.code == project_id)
                | (Project.code.ilike(clean_code))
                | (Project.code.ilike(f"%{slug_prefix}%"))
                | (Project.name.ilike(f"%{slug_prefix}%"))
                | (Project.code.ilike(f"%{project_id}%"))
            ),
            Project.is_deleted.is_(False),
        )
        .first()
    )
    if not project and project_id.startswith("proj-"):
        project = db.query(Project).filter(Project.is_deleted.is_(False)).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    verify_client_isolation(project.client_id, scope)
    assert_can_access(project, scope)

    cl = db.query(Client).filter_by(id=project.client_id).first()
    mgr = db.query(User).filter_by(id=project.manager_id).first() if project.manager_id else None

    # Members
    members_data = (
        db.query(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .filter(ProjectMember.project_id == project.id)
        .all()
    )
    member_items = [
        MemberItem(
            id=pm.id,
            user_id=u.id,
            name=u.full_name,
            email=u.email,
            project_role=pm.project_role,
        )
        for pm, u in members_data
    ]

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
        task_query = task_query.filter(Task.is_client_visible.is_(True))
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
            members=member_items,
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project code '{payload.code}' already exists.",
        )

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
    db.flush()

    log_audit_event(
        db=db,
        action="project.create",
        resource_type="project",
        resource_id=project.id,
        user=scope.user,
        new_values={"name": project.name, "code": project.code},
    )
    db.commit()
    db.refresh(project)

    return ApiResponse(success=True, data=project.id, message="Project workspace created.")


# --- Explicit State Machine Transition ---
@router.post("/{project_id}/transition", response_model=ApiResponse[bool])
def transition_project_status(
    project_id: str,
    payload: ProjectTransitionRequest,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Execute validated project state machine transitions."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    current_status = project.status
    target_status = payload.to_status.lower().strip()

    valid_targets = VALID_PROJECT_TRANSITIONS.get(current_status, [])
    if target_status not in valid_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{target_status}'. Allowed transitions: {valid_targets}",
        )

    project.status = target_status
    if target_status == "completed":
        project.completed_at = datetime.now(UTC)
        project.progress_percent = 100
    elif target_status in ("planning", "in_progress") and current_status == "completed":
        project.completed_at = None

    log_audit_event(
        db=db,
        action="project.transition",
        resource_type="project",
        resource_id=project.id,
        user=scope.user,
        old_values={"status": current_status},
        new_values={"status": target_status, "reason": payload.reason},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=True,
        message=f"Project transitioned from {current_status} to {target_status}.",
    )


# --- Members Management ---
@router.get("/{project_id}/members", response_model=ApiResponse[list[MemberItem]])
def list_project_members(
    project_id: str,
    scope: AccessScope = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    """List all members assigned to project."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    members_data = (
        db.query(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .filter(ProjectMember.project_id == project.id)
        .all()
    )
    items = [
        MemberItem(
            id=pm.id,
            user_id=u.id,
            name=u.full_name,
            email=u.email,
            project_role=pm.project_role,
        )
        for pm, u in members_data
    ]
    return ApiResponse(success=True, data=items)


@router.post("/{project_id}/members", response_model=ApiResponse[str])
def add_project_member(
    project_id: str,
    payload: AddMemberRequest,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Add a staff member to project."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    user = db.query(User).filter_by(id=payload.user_id, is_active=True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    existing = db.query(ProjectMember).filter_by(project_id=project.id, user_id=user.id).first()
    if existing:
        existing.project_role = payload.project_role
        db.commit()
        return ApiResponse(success=True, data=existing.id, message="Member role updated.")

    member = ProjectMember(
        project_id=project.id,
        user_id=user.id,
        project_role=payload.project_role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return ApiResponse(success=True, data=member.id, message="Member added to project.")


@router.delete("/{project_id}/members/{user_id}", response_model=ApiResponse[bool])
def remove_project_member(
    project_id: str,
    user_id: str,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Remove member from project."""
    member = db.query(ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not in project.")

    db.delete(member)
    db.commit()
    return ApiResponse(success=True, data=True, message="Member removed from project.")


# --- Milestones CRUD & Progress Calculation ---
@router.post("/{project_id}/milestones", response_model=ApiResponse[str])
def create_milestone(
    project_id: str,
    payload: CreateMilestoneRequest,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Create a milestone and recalculate project progress."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    milestone = Milestone(
        project_id=project.id,
        title=payload.title.strip(),
        due_date=payload.due_date,
        description=payload.description,
        order_index=payload.order_index,
    )
    db.add(milestone)
    db.flush()

    _recalculate_project_progress(project, db)
    db.commit()
    db.refresh(milestone)

    return ApiResponse(success=True, data=milestone.id, message="Milestone created.")


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=ApiResponse[bool])
def update_milestone(
    project_id: str,
    milestone_id: str,
    payload: UpdateMilestoneRequest,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Update milestone completion status or due date and recalculate progress."""
    milestone = (
        db.query(Milestone)
        .filter_by(id=milestone_id, project_id=project_id, is_deleted=False)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found.")

    project = db.query(Project).filter_by(id=project_id).first()

    if payload.title is not None:
        milestone.title = payload.title.strip()
    if payload.due_date is not None:
        milestone.due_date = payload.due_date
    if payload.description is not None:
        milestone.description = payload.description
    if payload.order_index is not None:
        milestone.order_index = payload.order_index
    if payload.is_completed is not None:
        milestone.is_completed = payload.is_completed
        milestone.completed_at = datetime.now(UTC) if payload.is_completed else None

    if project:
        _recalculate_project_progress(project, db)

    db.commit()
    return ApiResponse(success=True, data=True, message="Milestone updated.")


@router.delete("/{project_id}/milestones/{milestone_id}", response_model=ApiResponse[bool])
def delete_milestone(
    project_id: str,
    milestone_id: str,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Soft delete milestone and recalculate project progress."""
    milestone = (
        db.query(Milestone)
        .filter_by(id=milestone_id, project_id=project_id, is_deleted=False)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found.")

    milestone.is_deleted = True
    project = db.query(Project).filter_by(id=project_id).first()
    if project:
        _recalculate_project_progress(project, db)

    db.commit()
    return ApiResponse(success=True, data=True, message="Milestone removed.")


# --- Tasks CRUD ---
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
    db.flush()

    _recalculate_project_progress(project, db)
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
    """Update task status and auto-update project progress."""
    task = db.query(Task).filter_by(id=task_id, is_deleted=False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.status = payload.status
    if payload.status == "completed":
        task.completed_at = datetime.now(UTC)
    else:
        task.completed_at = None

    project = db.query(Project).filter_by(id=task.project_id).first()
    if project:
        _recalculate_project_progress(project, db)

    db.commit()
    return ApiResponse(success=True, data=True, message="Task status updated.")


# --- Deliverable Versioning & Approvals ---
@router.post("/{project_id}/deliverables", response_model=ApiResponse[str])
def create_deliverable(
    project_id: str,
    payload: CreateDeliverableRequest,
    scope: AccessScope = Depends(require_permission("projects.edit")),
    db: Session = Depends(get_db),
):
    """Create or version bump a deliverable."""
    project = db.query(Project).filter_by(id=project_id, is_deleted=False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    # Check existing version with same title in this project
    existing = (
        db.query(Deliverable)
        .filter_by(project_id=project.id, title=payload.title.strip(), is_deleted=False)
        .order_by(desc(Deliverable.version))
        .first()
    )
    next_version = (existing.version + 1) if existing else 1

    deliverable = Deliverable(
        project_id=project.id,
        task_id=payload.task_id,
        title=payload.title.strip(),
        description=payload.description,
        file_url=payload.file_url,
        version=next_version,
        status="pending_review",
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)

    return ApiResponse(
        success=True,
        data=deliverable.id,
        message=f"Deliverable v{deliverable.version} uploaded successfully.",
    )


class DeliverableOutItem(BaseModel):
    id: str
    project_id: str
    project_name: str
    client_name: str
    title: str
    description: str | None = None
    file_url: str
    version: int
    status: str
    client_feedback: str | None = None
    approved_at: str | None = None
    created_at: str


@router.get("/deliverables/pending", response_model=ApiResponse[list[DeliverableOutItem]])
def list_pending_deliverables(
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List deliverables pending approval or review (for client portal & managers)."""
    query = (
        db.query(Deliverable)
        .join(Project, Deliverable.project_id == Project.id)
        .filter(Deliverable.is_deleted.is_(False), Project.is_deleted.is_(False))
    )

    if scope.user.user_type == "client" and scope.client_id:
        query = query.filter(Project.client_id == scope.client_id)

    deliverables = query.order_by(desc(Deliverable.created_at)).all()

    items = []
    for d in deliverables:
        proj = db.query(Project).filter_by(id=d.project_id).first()
        client = db.query(Client).filter_by(id=proj.client_id).first() if proj else None

        items.append(
            DeliverableOutItem(
                id=d.id,
                project_id=d.project_id,
                project_name=proj.name if proj else "Project",
                client_name=client.name if client else "Client",
                title=d.title,
                description=d.description,
                file_url=d.file_url or "",
                version=d.version,
                status=d.status,
                client_feedback=d.client_feedback,
                approved_at=d.approved_at.isoformat() if d.approved_at else None,
                created_at=d.created_at.isoformat() if d.created_at else datetime.now(UTC).isoformat(),
            )
        )

    return ApiResponse(success=True, data=items)


@router.post("/deliverables/{deliverable_id}/review", response_model=ApiResponse[bool])
def review_deliverable(
    deliverable_id: str,
    payload: DeliverableApprovalRequest,
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Screen 5: Client approval / request changes for project deliverables."""
    deliverable = db.query(Deliverable).filter_by(id=deliverable_id, is_deleted=False).first()
    if not deliverable:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deliverable not found.")

    deliverable.status = payload.status
    deliverable.client_feedback = payload.feedback
    if payload.status == "approved":
        deliverable.approved_at = datetime.now(UTC)
        deliverable.approved_by_id = scope.user.id

    log_audit_event(
        db=db,
        action="deliverable.review",
        resource_type="deliverable",
        resource_id=deliverable.id,
        user=scope.user,
        new_values={"status": payload.status, "feedback": payload.feedback},
    )
    db.commit()

    return ApiResponse(
        success=True,
        data=True,
        message="Deliverable approved successfully."
        if payload.status == "approved"
        else "Revision request recorded.",
    )


# --- Polymorphic Comments ---
@router.get("/{project_id}/comments", response_model=ApiResponse[list[CommentItem]])
def list_project_comments(
    project_id: str,
    entity_type: str = Query("project"),
    entity_id: str | None = None,
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """List comments on a project, task, or deliverable, hiding internal notes from clients."""
    target_id = entity_id or project_id
    query = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)
        .filter(
            Comment.entity_type == entity_type,
            Comment.entity_id == target_id,
            Comment.is_deleted.is_(False),
        )
    )

    # Scoping: if user is client, strictly hide internal comments
    if scope.user.user_type == "client":
        query = query.filter(Comment.is_internal.is_(False))

    results = query.order_by(Comment.created_at.asc()).all()

    items = [
        CommentItem(
            id=c.id,
            entity_type=c.entity_type,
            entity_id=c.entity_id,
            user_id=u.id,
            user_name=u.full_name,
            content=c.content,
            is_internal=c.is_internal,
            created_at=c.created_at.isoformat(),
        )
        for c, u in results
    ]
    return ApiResponse(success=True, data=items)


@router.post("/{project_id}/comments", response_model=ApiResponse[str])
def post_project_comment(
    project_id: str,
    payload: CreateCommentRequest,
    scope: AccessScope = Depends(require_permission("projects.read", allow_client=True)),
    db: Session = Depends(get_db),
):
    """Post a comment. If posted by a client, force is_internal=False."""
    is_internal = payload.is_internal
    if scope.user.user_type == "client":
        is_internal = False

    comment = Comment(
        entity_type=payload.entity_type,
        entity_id=payload.entity_id or project_id,
        user_id=scope.user.id,
        content=payload.content.strip(),
        is_internal=is_internal,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return ApiResponse(success=True, data=comment.id, message="Comment posted.")
