"""Export all SQLAlchemy models for Alembic and application queries."""

from app.db.base import Base
from app.db.models.auth import (
    Organization,
    PasswordResetToken,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
    UserSession,
)
from app.db.models.common import (
    AuditLog,
    FileAsset,
    Notification,
    SystemSetting,
)
from app.db.models.crm import (
    Client,
    ClientContact,
    ClientService,
    Contract,
    Lead,
    LeadActivity,
    Proposal,
    ProposalLineItem,
    ServiceCatalogue,
)
from app.db.models.finance import (
    CreditNote,
    Invoice,
    InvoiceLineItem,
    Payment,
)
from app.db.models.hr import (
    Attendance,
    Department,
    Employee,
    LeaveBalance,
    LeaveLedger,
    LeaveRequest,
    Timesheet,
)
from app.db.models.projects import (
    Comment,
    Deliverable,
    Milestone,
    Project,
    ProjectMember,
    Task,
    TaskAssignee,
)
from app.db.models.support import (
    SupportTicket,
    TicketComment,
)

__all__ = [
    "Attendance",
    "AuditLog",
    "Base",
    "Client",
    "ClientContact",
    "ClientService",
    "Comment",
    "Contract",
    "CreditNote",
    "Deliverable",
    "Department",
    "Employee",
    "FileAsset",
    "Invoice",
    "InvoiceLineItem",
    "Lead",
    "LeadActivity",
    "LeaveBalance",
    "LeaveLedger",
    "LeaveRequest",
    "Milestone",
    "Notification",
    "Organization",
    "PasswordResetToken",
    "Payment",
    "Permission",
    "Project",
    "ProjectMember",
    "Proposal",
    "ProposalLineItem",
    "Role",
    "RolePermission",
    "ServiceCatalogue",
    "SupportTicket",
    "SystemSetting",
    "Task",
    "TaskAssignee",
    "TicketComment",
    "Timesheet",
    "User",
    "UserRole",
    "UserSession",
]
