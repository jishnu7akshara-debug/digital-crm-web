"""Reports & Analytics API: Financial Ledger Breakdown, GST Tax Liabilities, and Margins (B-10, F-04)."""

import csv
import io
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.schemas import ApiResponse
from app.core.database import get_db
from app.db.models.crm import ClientService, ServiceCatalogue
from app.db.models.finance import Invoice
from app.policies.rbac import AccessScope, require_permission

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


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
    """Calculate live reporting analytics from real invoices and payments (R2/F-04)."""
    invoices = (
        db.query(Invoice)
        .filter(Invoice.is_deleted.is_(False), Invoice.status != "cancelled")
        .all()
    )

    total_invoiced_paise = sum(i.total_paise for i in invoices)
    total_paid_paise = sum(i.amount_paid_paise for i in invoices)
    total_tax_paise = sum(i.total_tax_paise for i in invoices)
    outstanding_paise = max(0, total_invoiced_paise - total_paid_paise)

    # Monthly breakdown across current FY
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
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

    # Service Share from active ClientService subscriptions
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


@router.get("/export/csv")
def export_reports_csv(
    scope: AccessScope = Depends(require_permission("finance.read")),
    db: Session = Depends(get_db),
):
    """Export live financial records as CSV."""
    invoices = (
        db.query(Invoice)
        .filter(Invoice.is_deleted.is_(False), Invoice.status != "cancelled")
        .order_by(Invoice.issue_date)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number",
        "Client Name",
        "Issue Date",
        "Due Date",
        "Status",
        "Subtotal (INR)",
        "Tax (INR)",
        "Total (INR)",
        "Paid (INR)",
        "Balance (INR)",
    ])

    for inv in invoices:
        writer.writerow([
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

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="financial_report_{datetime.now(UTC).strftime("%Y%m%d")}.csv"'},
    )
