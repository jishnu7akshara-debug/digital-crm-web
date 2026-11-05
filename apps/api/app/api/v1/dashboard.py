"""Dashboard API: Scoped KPIs, Revenue Analytics, Overdue Invoices, Deadlines."""
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.policies.rbac import get_current_user, require_permission, AccessScope
from app.api.schemas import ApiResponse
from app.db.models.crm import Client, Lead
from app.db.models.projects import Project, Task
from app.db.models.finance import Invoice, Payment
from app.db.models.common import AuditLog

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class KpiMetric(BaseModel):
    label: str
    value: Any
    subtext: Optional[str] = None
    change_percent: Optional[float] = None
    trend: Optional[str] = None  # "up", "down", "neutral"


class MonthlyRevenuePoint(BaseModel):
    month: str
    invoiced_rupees: float
    collected_rupees: float


class DashboardOverviewResponse(BaseModel):
    total_leads: int
    active_clients: int
    active_projects: int
    pending_tasks: int
    total_invoiced_rupees: float
    total_collected_rupees: float
    total_outstanding_rupees: float
    monthly_revenue: List[MonthlyRevenuePoint]
    upcoming_deadlines: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]


@router.get("/kpis", response_model=ApiResponse[DashboardOverviewResponse])
def get_dashboard_kpis(
    scope: AccessScope = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    """Fetch real-time dashboard KPIs with strict permission scoping."""
    # 1. Total Leads
    lead_query = db.query(Lead).filter(Lead.is_deleted == False)
    if scope.scope == "own":
        lead_query = lead_query.filter(Lead.assigned_to_id == scope.user.id)
    total_leads = lead_query.count()

    # 2. Active Clients
    client_query = db.query(Client).filter(Client.is_deleted == False)
    if scope.user.user_type == "client":
        client_query = client_query.filter(Client.id == scope.client_id)
    active_clients = client_query.count()

    # 3. Active Projects
    project_query = db.query(Project).filter(
        Project.is_deleted == False,
        Project.status.in_(["in_progress", "planning", "internal_review", "client_review"]),
    )
    if scope.user.user_type == "client":
        project_query = project_query.filter(Project.client_id == scope.client_id)
    elif scope.scope == "own":
        project_query = project_query.filter(Project.manager_id == scope.user.id)
    active_projects = project_query.count()

    # 4. Pending Tasks
    task_query = db.query(Task).filter(
        Task.is_deleted == False,
        Task.status.in_(["todo", "in_progress", "in_review", "blocked"]),
    )
    if scope.scope == "own":
        task_query = task_query.filter(Task.owner_id == scope.user.id)
    pending_tasks = task_query.count()

    # 5. Financials (Invoiced, Collected, Outstanding)
    invoice_query = db.query(Invoice).filter(
        Invoice.is_deleted == False,
        Invoice.status != "cancelled",
    )
    if scope.user.user_type == "client":
        invoice_query = invoice_query.filter(Invoice.client_id == scope.client_id)

    invoices = invoice_query.all()
    total_invoiced_paise = sum(i.total_paise for i in invoices)
    total_collected_paise = sum(i.amount_paid_paise for i in invoices)
    total_outstanding_paise = sum(i.balance_paise for i in invoices)

    # 6. Monthly Revenue Trend (Last 6 Months)
    today = date.today()
    monthly_data: List[MonthlyRevenuePoint] = []
    for i in range(5, -1, -1):
        target_month = (today.month - i - 1) % 12 + 1
        year_offset = (today.month - i - 1) // 12
        target_year = today.year + year_offset
        month_label = date(target_year, target_month, 1).strftime("%b %Y")

        m_invoices = [
            inv for inv in invoices
            if inv.issue_date.year == target_year and inv.issue_date.month == target_month
        ]
        invoiced_amt = sum(inv.total_paise for inv in m_invoices) / 100.0
        collected_amt = sum(inv.amount_paid_paise for inv in m_invoices) / 100.0

        monthly_data.append(
            MonthlyRevenuePoint(
                month=month_label,
                invoiced_rupees=round(invoiced_amt, 2),
                collected_rupees=round(collected_amt, 2),
            )
        )

    # 7. Upcoming Deadlines
    upcoming = (
        project_query
        .filter(Project.due_date.isnot(None), Project.due_date >= today)
        .order_by(Project.due_date.asc())
        .limit(5)
        .all()
    )
    deadlines_list = [
        {
            "id": p.id,
            "title": p.name,
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "progress_percent": p.progress_percent,
            "status": p.status,
        }
        for p in upcoming
    ]

    # 8. Recent Activity / Audit Log
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(8)
        .all()
    )
    activity_list = [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "user_email": log.user_email or "System",
            "timestamp": log.timestamp.isoformat(),
        }
        for log in recent_logs
    ]

    return ApiResponse(
        success=True,
        data=DashboardOverviewResponse(
            total_leads=total_leads,
            active_clients=active_clients,
            active_projects=active_projects,
            pending_tasks=pending_tasks,
            total_invoiced_rupees=round(total_invoiced_paise / 100.0, 2),
            total_collected_rupees=round(total_collected_paise / 100.0, 2),
            total_outstanding_rupees=round(total_outstanding_paise / 100.0, 2),
            monthly_revenue=monthly_data,
            upcoming_deadlines=deadlines_list,
            recent_activity=activity_list,
        ),
    )
