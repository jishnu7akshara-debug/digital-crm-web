"""Project & Task Management Models."""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, uuid_pk


class Project(Base, TimestampMixin, SoftDeleteMixin):
    """Project entity linked to a Client and ClientService."""

    __tablename__ = "projects"

    id: Mapped[str] = uuid_pk()
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_service_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("client_services.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="planning", nullable=False, index=True
    )  # "not_started", "planning", "in_progress", "internal_review", "client_review", "revision", "completed", "on_hold", "cancelled"
    priority: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )  # "low", "medium", "high", "urgent"
    manager_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    budget_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    members: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[list["Milestone"]] = relationship(
        "Milestone", back_populates="project", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="project", cascade="all, delete-orphan"
    )
    deliverables: Mapped[list["Deliverable"]] = relationship(
        "Deliverable", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectMember(Base, TimestampMixin):
    """Team members allocated to a project."""

    __tablename__ = "project_members"

    id: Mapped[str] = uuid_pk()
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_role: Mapped[str] = mapped_column(
        String(50), default="contributor", nullable=False
    )  # "lead", "contributor", "reviewer", "client_viewer"

    project: Mapped["Project"] = relationship("Project", back_populates="members")


class Milestone(Base, TimestampMixin, SoftDeleteMixin):
    """Key deliverable milestones within a project."""

    __tablename__ = "milestones"

    id: Mapped[str] = uuid_pk()
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="milestones")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="milestone")


class Task(Base, TimestampMixin, SoftDeleteMixin):
    """Individual task or subtask with single owner, collaborators, and client visibility."""

    __tablename__ = "tasks"

    id: Mapped[str] = uuid_pk()
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    milestone_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    parent_task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="todo", nullable=False, index=True
    )  # "todo", "in_progress", "in_review", "completed", "blocked"
    priority: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False, index=True
    )  # "low", "medium", "high", "urgent"
    owner_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    estimated_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    logged_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_client_visible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )

    project: Mapped["Project"] = relationship("Project", back_populates="tasks")
    milestone: Mapped[Optional["Milestone"]] = relationship("Milestone", back_populates="tasks")
    assignees: Mapped[list["TaskAssignee"]] = relationship(
        "TaskAssignee", back_populates="task", cascade="all, delete-orphan"
    )


class TaskAssignee(Base):
    """Collaborators assigned to a task."""

    __tablename__ = "task_assignees"

    id: Mapped[str] = uuid_pk()
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    task: Mapped["Task"] = relationship("Task", back_populates="assignees")


class Deliverable(Base, TimestampMixin, SoftDeleteMixin):
    """Client deliverables uploaded for review and approval."""

    __tablename__ = "deliverables"

    id: Mapped[str] = uuid_pk()
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="pending_review", nullable=False, index=True
    )  # "draft", "pending_review", "approved", "revision_requested"
    client_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="deliverables")


class Comment(Base, TimestampMixin, SoftDeleteMixin):
    """Polymorphic comments on tasks, projects, tickets, or leads."""

    __tablename__ = "comments"

    id: Mapped[str] = uuid_pk()
    entity_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # "task", "project", "ticket", "lead"
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[Text] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # Clients cannot see internal comments
