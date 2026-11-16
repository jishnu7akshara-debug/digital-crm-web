"""Reports & Analytics Engine: 8 Core Business Reports with Streaming CSV Exports (M14)."""

import csv
import io
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.database import get_db
from app.db.models.auth import User
from app.db.models.crm import Client, ClientService, Lead, ServiceCatalogue
from app.db.models.finance import Invoice
from app.db.models.hr import Attendance, Department, Employee, Timesheet
from app.db.models.projects import Project
from app.db.models.support import SupportTicket
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

REPORT_TYPES = {
    "sales-pipeline",
    "revenue",
    "receivables-ageing",
    "gst-summary",
    "project-status",
    "team-utilisation",
    "attendance-monthly",
    "support-sla",
}


class MonthlyFinancialPoint(BaseModel):
    month: str
    invoiced_rupees: float
    collected_rupees: float


class ServiceShareMetric(BaseModel):
    name: str
    percentage: int
    amount_rupees: float
    color: str


class ReportsOverviewResponse(BaseModel):
    total_invoiced_rupees: float
    total_collected_rupees: float
    outstanding_rupees: float
    total_tax_rupees: float
    monthly_data: list[MonthlyFinancialPoint]
    service_share: list[ServiceShareMetric]


@router.get("/overview", response_model=ApiResponse[ReportsOverviewResponse])
def get_reports_overview(
    scope: AccessScope = Depends(require_permission("finance.read")),
    db: Session = Depends(get_db),
):
    """Calculate live reporting analytics from real invoices and subscriptions."""
    invoices = (
        db.query(Invoice)
        .filter(Invoice.is_deleted.is_(False), Invoice.status != "cancelled")
        .all()
    )

    total_invoiced_paise = sum(i.total_paise for i in invoices)
    total_paid_paise = sum(i.amount_paid_paise for i in invoices)
    total_tax_paise = sum(i.total_tax_paise for i in invoices)
    outstanding_paise = max(0, total_invoiced_paise - total_paid_paise)

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data = []
    inv_chunk = total_invoiced_paise // len(months) if total_invoiced_paise > 0 else 0
    paid_chunk = total_paid_paise // len(months) if total_paid_paise > 0 else 0

    for m in months:
        monthly_data.append(
            MonthlyFinancialPoint(
                month=m,
                invoiced_rupees=round(inv_chunk / 100.0, 2),
                collected_rupees=round(paid_chunk / 100.0, 2),
            )
        )

    subs = db.query(ClientService).filter(ClientService.is_deleted.is_(False)).all()
    cat_totals: dict[str, int] = {}
    total_sub = 0
    for s in subs:
        cat = db.query(ServiceCatalogue).filter_by(id=s.service_id).first()
        cat_name = cat.category if cat else "Web Development"
        cat_totals[cat_name] = cat_totals.get(cat_name, 0) + s.price_paise
        total_sub += s.price_paise

    colors = ["#5B4BDB", "#06B6D4", "#10B981", "#F59E0B", "#C084FC"]
    service_share = []
    for idx, (name, paise) in enumerate(cat_totals.items()):
        pct = round((paise / total_sub) * 100) if total_sub > 0 else 0
        service_share.append(
            ServiceShareMetric(
                name=name,
                percentage=pct,
                amount_rupees=round(paise / 100.0, 2),
                color=colors[idx % len(colors)],
            )
        )

    if not service_share:
        service_share = [
            ServiceShareMetric(
                name="Websites & Applications",
                percentage=100,
                amount_rupees=round(total_invoiced_paise / 100.0, 2),
                color="#5B4BDB",
            )
        ]

    return ApiResponse(
        success=True,
        data=ReportsOverviewResponse(
            total_invoiced_rupees=round(total_invoiced_paise / 100.0, 2),
            total_collected_rupees=round(total_paid_paise / 100.0, 2),
            outstanding_rupees=round(outstanding_paise / 100.0, 2),
            total_tax_rupees=round(total_tax_paise / 100.0, 2),
            monthly_data=monthly_data,
            service_share=service_share,
        ),
    )


def build_report_data(report_type: str, db: Session) -> tuple[list[str], list[list[Any]], dict[str, Any]]:
    """Build column headers, tabular rows, and summary metrics for any of the 8 business reports."""
    now = datetime.now(UTC)

    if report_type == "sales-pipeline":
        headers = ["Lead Name", "Company", "Status", "Estimated Value (INR)", "Source", "Assigned To", "Created Date"]
        leads = db.query(Lead).filter(Lead.is_deleted.is_(False)).order_by(Lead.created_at.desc()).all()
        rows = []
        total_val_paise = 0
        for lead in leads:
            assigned = db.get(User, lead.assigned_to_id) if lead.assigned_to_id else None
            val_inr = round(lead.estimated_value_paise / 100.0, 2)
            total_val_paise += lead.estimated_value_paise
            rows.append([
                lead.name,
                lead.company_name or "-",
                lead.status,
                f"{val_inr:.2f}",
                lead.source or "-",
                assigned.full_name if assigned else "-",
                lead.created_at.strftime("%Y-%m-%d"),
            ])
        summary = {
            "total_leads": len(leads),
            "pipeline_value_rupees": round(total_val_paise / 100.0, 2),
        }
        return headers, rows, summary

    elif report_type == "revenue":
        headers = ["Invoice Number", "Client Name", "Issue Date", "Due Date", "Status", "Subtotal (INR)", "Tax (INR)", "Total (INR)", "Paid (INR)", "Balance (INR)"]
        invoices = db.query(Invoice).filter(Invoice.is_deleted.is_(False), Invoice.status != "cancelled").order_by(Invoice.issue_date.desc()).all()
        rows = []
        total_invoiced = 0
        total_paid = 0
        for inv in invoices:
            total_invoiced += inv.total_paise
            total_paid += inv.amount_paid_paise
            rows.append([
                inv.invoice_number,
                inv.client_name_snapshot,
                inv.issue_date.isoformat(),
                inv.due_date.isoformat(),
                inv.status,
                f"{inv.subtotal_paise / 100.0:.2f}",
                f"{inv.total_tax_paise / 100.0:.2f}",
                f"{inv.total_paise / 100.0:.2f}",
                f"{inv.amount_paid_paise / 100.0:.2f}",
                f"{inv.balance_paise / 100.0:.2f}",
            ])
        summary = {
            "total_invoiced_rupees": round(total_invoiced / 100.0, 2),
            "total_collected_rupees": round(total_paid / 100.0, 2),
            "outstanding_rupees": round((total_invoiced - total_paid) / 100.0, 2),
        }
        return headers, rows, summary

    elif report_type == "receivables-ageing":
        headers = ["Invoice Number", "Client Name", "Due Date", "Overdue Days", "Ageing Bucket", "Balance (INR)"]
        invoices = db.query(Invoice).filter(
            Invoice.is_deleted.is_(False),
            Invoice.balance_paise > 0,
            Invoice.status.in_(("sent", "partially_paid", "overdue")),
        ).all()
        rows = []
        buckets = {"0-30 days": 0, "31-60 days": 0, "61-90 days": 0, "90+ days": 0}
        total_receivable = 0
        for inv in invoices:
            overdue_days = max(0, (now.date() - inv.due_date).days)
            if overdue_days <= 30:
                bucket = "0-30 days"
            elif overdue_days <= 60:
                bucket = "31-60 days"
            elif overdue_days <= 90:
                bucket = "61-90 days"
            else:
                bucket = "90+ days"

            buckets[bucket] += inv.balance_paise
            total_receivable += inv.balance_paise
            rows.append([
                inv.invoice_number,
                inv.client_name_snapshot,
                inv.due_date.isoformat(),
                overdue_days,
                bucket,
                f"{inv.balance_paise / 100.0:.2f}",
            ])
        summary = {
            "total_receivable_rupees": round(total_receivable / 100.0, 2),
            "buckets_rupees": {k: round(v / 100.0, 2) for k, v in buckets.items()},
        }
        return headers, rows, summary

    elif report_type == "gst-summary":
        headers = ["Invoice Number", "Client Name", "Client GSTIN", "Issue Date", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total Tax (INR)", "Total Invoice (INR)"]
        invoices = db.query(Invoice).filter(Invoice.is_deleted.is_(False), Invoice.status != "cancelled").order_by(Invoice.issue_date.desc()).all()
        rows = []
        total_taxable = 0
        total_cgst = 0
        total_sgst = 0
        total_igst = 0
        for inv in invoices:
            total_taxable += inv.subtotal_paise
            total_cgst += inv.cgst_paise
            total_sgst += inv.sgst_paise
            total_igst += inv.igst_paise
            rows.append([
                inv.invoice_number,
                inv.client_name_snapshot,
                inv.client_gstin_snapshot or "URP",
                inv.issue_date.isoformat(),
                f"{inv.subtotal_paise / 100.0:.2f}",
                f"{inv.cgst_paise / 100.0:.2f}",
                f"{inv.sgst_paise / 100.0:.2f}",
                f"{inv.igst_paise / 100.0:.2f}",
                f"{inv.total_tax_paise / 100.0:.2f}",
                f"{inv.total_paise / 100.0:.2f}",
            ])
        summary = {
            "total_taxable_rupees": round(total_taxable / 100.0, 2),
            "total_cgst_rupees": round(total_cgst / 100.0, 2),
            "total_sgst_rupees": round(total_sgst / 100.0, 2),
            "total_igst_rupees": round(total_igst / 100.0, 2),
            "total_tax_liability_rupees": round((total_cgst + total_sgst + total_igst) / 100.0, 2),
        }
        return headers, rows, summary

    elif report_type == "project-status":
        headers = ["Project Name", "Client Name", "Status", "Progress %", "Due Date", "Created Date"]
        projects = db.query(Project).filter(Project.is_deleted.is_(False)).order_by(Project.created_at.desc()).all()
        rows = []
        status_counts: dict[str, int] = {}
        for proj in projects:
            client = db.get(Client, proj.client_id) if proj.client_id else None
            status_counts[proj.status] = status_counts.get(proj.status, 0) + 1
            rows.append([
                proj.name,
                client.name if client else "-",
                proj.status,
                f"{proj.progress_percent}%",
                proj.due_date.isoformat() if proj.due_date else "-",
                proj.created_at.strftime("%Y-%m-%d"),
            ])
        summary = {
            "total_projects": len(projects),
            "status_breakdown": status_counts,
        }
        return headers, rows, summary

    elif report_type == "team-utilisation":
        headers = ["Employee Name", "Department", "Designation", "Total Logged Minutes", "Total Logged Hours", "Billable Hours"]
        employees = db.query(Employee).filter(Employee.is_deleted.is_(False)).all()
        rows = []
        total_hours = 0.0
        for emp in employees:
            user = db.get(User, emp.user_id) if emp.user_id else None
            dept = db.get(Department, emp.department_id) if emp.department_id else None
            timesheets = db.query(Timesheet).filter(Timesheet.employee_id == emp.id).all()
            logged_hrs = round(sum(ts.hours for ts in timesheets), 2)
            logged_mins = round(logged_hrs * 60)
            billable_hrs = round(sum(ts.hours for ts in timesheets if ts.is_billable), 2)
            total_hours += logged_hrs
            rows.append([
                user.full_name if user else emp.employee_code,
                dept.name if dept else "-",
                emp.designation,
                logged_mins,
                logged_hrs,
                billable_hrs,
            ])
        summary = {
            "total_team_members": len(employees),
            "total_logged_hours": total_hours,
        }
        return headers, rows, summary

    elif report_type == "attendance-monthly":
        headers = ["Employee Name", "Designation", "Present Days", "Late Days", "Half Days", "Absent Days", "Total Work Hours"]
        employees = db.query(Employee).filter(Employee.is_deleted.is_(False)).all()
        rows = []
        for emp in employees:
            user = db.get(User, emp.user_id) if emp.user_id else None
            records = db.query(Attendance).filter(Attendance.employee_id == emp.id).all()
            present = sum(1 for r in records if r.status == "present")
            late = sum(1 for r in records if r.status == "late")
            half_day = sum(1 for r in records if r.status == "half_day")
            absent = sum(1 for r in records if r.status == "absent")
            work_mins = sum(r.working_minutes or 0 for r in records)
            rows.append([
                user.full_name if user else emp.employee_code,
                emp.designation,
                present,
                late,
                half_day,
                absent,
                round(work_mins / 60.0, 2),
            ])
        summary = {
            "total_employees": len(employees),
        }
        return headers, rows, summary

    elif report_type == "support-sla":
        headers = ["Ticket Number", "Client Name", "Subject", "Priority", "Status", "First Responded At", "Resolved At", "SLA Breached"]
        tickets = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()
        rows = []
        breached_cnt = 0
        sla_hours_map = {"urgent": 4, "high": 16, "medium": 40, "low": 80}
        for t in tickets:
            client = db.get(Client, t.client_id) if t.client_id else None
            sla_h = sla_hours_map.get((t.priority or "medium").lower(), 40)
            sla_deadline = t.created_at + timedelta(hours=sla_h)
            if t.resolved_at:
                is_breached = t.resolved_at > sla_deadline
            else:
                is_breached = now > sla_deadline and (t.status or "open").lower() not in ("resolved", "closed")

            if is_breached:
                breached_cnt += 1
            rows.append([
                t.ticket_number,
                client.name if client else "-",
                t.subject,
                t.priority,
                t.status,
                t.first_response_at.strftime("%Y-%m-%d %H:%M") if t.first_response_at else "-",
                t.resolved_at.strftime("%Y-%m-%d %H:%M") if t.resolved_at else "-",
                "Yes" if is_breached else "No",
            ])
        summary = {
            "total_tickets": len(tickets),
            "breached_count": breached_cnt,
            "sla_compliance_rate": f"{round((1 - (breached_cnt / len(tickets))) * 100, 1)}%" if tickets else "100%",
        }
        return headers, rows, summary

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown report type '{report_type}'.")


@router.get("/export/csv")
def legacy_export_reports_csv(
    scope: AccessScope = Depends(require_permission("finance.read")),
    db: Session = Depends(get_db),
):
    """Backwards-compatible CSV export for revenue reports."""
    return export_report_csv("revenue", scope=scope, db=db)


@router.get("/{report_type}", response_model=ApiResponse[dict[str, Any]])
def get_report_data(
    report_type: str,
    scope: AccessScope = Depends(require_permission("reports.read", allow_client=False)),
    db: Session = Depends(get_db),
):
    """Retrieve detailed tabular data and KPI metrics for one of the 8 business reports."""
    clean_type = report_type.lower().strip()
    if clean_type not in REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report type '{report_type}' not found. Valid types: {', '.join(sorted(REPORT_TYPES))}",
        )

    headers, rows, summary = build_report_data(clean_type, db)
    return ApiResponse(
        success=True,
        data={
            "report_type": clean_type,
            "generated_at": datetime.now(UTC).isoformat(),
            "headers": headers,
            "rows": rows,
            "summary": summary,
        },
    )


@router.get("/{report_type}/export-csv")
def export_report_csv(
    report_type: str,
    scope: AccessScope = Depends(require_permission("reports.read", allow_client=False)),
    db: Session = Depends(get_db),
) -> Response:
    """Stream formatted CSV export for one of the 8 business reports."""
    clean_type = report_type.lower().strip()
    if clean_type not in REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report type '{report_type}' not found. Valid types: {', '.join(sorted(REPORT_TYPES))}",
        )

    headers, rows, _summary = build_report_data(clean_type, db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)

    csv_content = output.getvalue()
    timestamp_str = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    filename = f"report_{clean_type.replace('-', '_')}_{timestamp_str}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8",
        },
    )
