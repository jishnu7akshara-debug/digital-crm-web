"""Database seed script for Digital Footprint OS."""

import datetime
import sys

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models import (
    Client,
    ClientContact,
    ClientService,
    Invoice,
    InvoiceLineItem,
    Milestone,
    Organization,
    Permission,
    Project,
    Role,
    RolePermission,
    ServiceCatalogue,
    Task,
    User,
    UserRole,
)

# Standard modules in Digital Footprint OS
MODULES = [
    "leads",
    "clients",
    "projects",
    "tasks",
    "invoices",
    "payments",
    "contracts",
    "attendance",
    "employees",
    "reports",
    "support",
    "settings",
    "proposals",
    "services",
]

# Permission definitions per module: read, create, edit, delete (plus specific actions)
PERMISSIONS_DEF = [
    # Leads
    ("leads.read", "leads", "View Leads", "Can view lead records"),
    ("leads.create", "leads", "Create Leads", "Can create new leads"),
    ("leads.edit", "leads", "Edit Leads", "Can update leads and status"),
    ("leads.delete", "leads", "Delete Leads", "Can delete leads"),
    ("leads.convert", "leads", "Convert Leads", "Can convert lead to client"),
    # Clients
    ("clients.read", "clients", "View Clients", "Can view client records and 360 profiles"),
    ("clients.create", "clients", "Create Clients", "Can register new clients"),
    ("clients.edit", "clients", "Edit Clients", "Can modify client details"),
    ("clients.delete", "clients", "Delete Clients", "Can delete/archive clients"),
    # Projects
    ("projects.read", "projects", "View Projects", "Can view project workspaces"),
    ("projects.create", "projects", "Create Projects", "Can create new projects"),
    ("projects.edit", "projects", "Edit Projects", "Can update project milestones and details"),
    ("projects.delete", "projects", "Delete Projects", "Can delete projects"),
    # Tasks
    ("tasks.read", "tasks", "View Tasks", "Can view tasks"),
    ("tasks.create", "tasks", "Create Tasks", "Can create tasks"),
    ("tasks.edit", "tasks", "Edit Tasks", "Can edit and reassign tasks"),
    ("tasks.delete", "tasks", "Delete Tasks", "Can delete tasks"),
    # Invoices
    ("invoices.read", "invoices", "View Invoices", "Can view invoices and billing records"),
    ("invoices.issue", "invoices", "Issue Invoices", "Can create and issue GST invoices"),
    ("invoices.cancel", "invoices", "Cancel Invoices", "Can cancel invoices with credit note"),
    # Payments
    ("payments.read", "payments", "View Payments", "Can view payment transactions"),
    ("payments.record", "payments", "Record Payments", "Can record and allocate client payments"),
    # Contracts
    ("contracts.read", "contracts", "View Contracts", "Can view contracts"),
    ("contracts.manage", "contracts", "Manage Contracts", "Can create and manage contracts"),
    # Attendance
    ("attendance.read", "attendance", "View Attendance", "Can view attendance logs"),
    ("attendance.punch", "attendance", "Punch Attendance", "Can check in and out"),
    ("attendance.manage", "attendance", "Manage Attendance", "Can approve corrections and reports"),
    # Employees
    ("employees.read", "employees", "View Employees", "Can view employee directory"),
    (
        "employees.manage",
        "employees",
        "Manage Employees",
        "Can add/edit employees and compensation",
    ),
    # Reports
    ("reports.read", "reports", "View Reports", "Can view and export reports"),
    # Support
    ("support.read", "support", "View Support Tickets", "Can view support tickets"),
    ("support.manage", "support", "Manage Support Tickets", "Can resolve and comment on tickets"),
    # Settings & RBAC
    ("settings.read", "settings", "View Settings", "Can view system settings"),
    (
        "settings.manage",
        "settings",
        "Manage Settings",
        "Can edit roles, permissions and configurations",
    ),
    # Proposals & Opportunities
    ("proposals.read", "proposals", "View Proposals", "Can view proposals and deals"),
    ("proposals.create", "proposals", "Create Proposals", "Can create quotations and proposals"),
    ("proposals.edit", "proposals", "Edit Proposals", "Can update proposal line items and status"),
    ("proposals.delete", "proposals", "Delete Proposals", "Can delete proposals"),
    # Services Catalog
    ("services.read", "services", "View Services", "Can view agency service catalog"),
    ("services.manage", "services", "Manage Services", "Can manage catalog offerings and tiers"),
]

# Matrix Mapping: role_code -> { module: scope }
# scope values: "all" (F), "assigned" (T), "own" (O), None (—)
ROLE_MATRIX = {
    "super_admin": {m: "all" for m in MODULES},
    "admin": {
        "leads": "all",
        "clients": "all",
        "projects": "all",
        "tasks": "all",
        "invoices": "all",
        "payments": "all",
        "contracts": "all",
        "attendance": "assigned",
        "employees": "assigned",
        "reports": "assigned",
        "support": "all",
        "settings": "assigned",
        "proposals": "all",
        "services": "all",
    },
    "sales": {
        "leads": "own",
        "clients": "assigned",
        "projects": "assigned",
        "tasks": "own",
        "invoices": "assigned",
        "contracts": "assigned",
        "attendance": "own",
        "reports": "assigned",
        "support": "assigned",
        "proposals": "assigned",
        "services": "all",
    },
    "project_manager": {
        "clients": "assigned",
        "projects": "assigned",
        "tasks": "assigned",
        "invoices": "assigned",
        "contracts": "assigned",
        "attendance": "own",
        "employees": "assigned",
        "reports": "assigned",
        "support": "assigned",
        "proposals": "assigned",
        "services": "all",
    },
    "employee": {
        "clients": "own",
        "projects": "own",
        "tasks": "own",
        "attendance": "own",
        "employees": "own",
        "reports": "own",
        "support": "own",
    },
    "hr": {
        "attendance": "all",
        "employees": "all",
        "reports": "all",
    },
    "finance": {
        "clients": "assigned",
        "projects": "assigned",
        "invoices": "all",
        "payments": "all",
        "contracts": "assigned",
        "reports": "all",
    },
    "support_agent": {
        "support": "all",
        "clients": "assigned",
        "attendance": "own",
    },
    "client_owner": {
        "clients": "client",
        "projects": "client",
        "tasks": "client",
        "invoices": "client",
        "payments": "client",
        "contracts": "client",
        "support": "client",
    },
    "client_manager": {
        "clients": "client",
        "projects": "client",
        "tasks": "client",
        "contracts": "client",
        "support": "client",
    },
    "client_finance": {
        "invoices": "client",
        "payments": "client",
        "contracts": "client",
    },
    "client_employee": {
        "projects": "client",
        "tasks": "client",
        "support": "client",
    },
}

# Client Portal Roles
PORTAL_ROLES = {
    "client_owner": "Client Owner (Full access to all client data, invoices, projects, users)",
    "client_manager": "Client Manager (Access to assigned projects, deliverables, approvals)",
    "client_employee": "Client Employee (Access to assigned tasks, uploads)",
    "client_finance": "Client Finance (Access strictly to invoices and payments)",
}


def seed_database() -> None:
    """Populate initial system data."""
    db: Session = SessionLocal()
    try:
        # 1. Organization
        org = db.query(Organization).filter_by(slug="digital-footprint").first()
        if not org:
            org = Organization(
                name="Digital Footprint Solutions Pvt Ltd",
                slug="digital-footprint",
                domain="digitalfootprint.in",
                gstin="27AABCD1234E1Z5",
                address="Level 5, Technology Tower, Pune, MH, India",
                phone="+91 20 4000 1234",
                email="info@digitalfootprint.in",
                is_client=False,
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Created organization: {org.name}")

        # 2. Permissions
        permissions_by_module = {}
        for code, module, name, desc in PERMISSIONS_DEF:
            perm = db.query(Permission).filter_by(code=code).first()
            if not perm:
                perm = Permission(code=code, module=module, name=name, description=desc)
                db.add(perm)
                db.commit()
                db.refresh(perm)
            permissions_by_module.setdefault(module, []).append(perm)

        # 3. Roles and RolePermissions
        role_objs = {}
        for role_code, matrix in ROLE_MATRIX.items():
            role_name = role_code.replace("_", " ").title()
            role = db.query(Role).filter_by(code=role_code).first()
            if not role:
                role = Role(
                    organization_id=org.id,
                    name=role_name,
                    code=role_code,
                    description=f"System {role_name} role",
                    is_system=True,
                    role_type="internal",
                )
                db.add(role)
                db.commit()
                db.refresh(role)
            role_objs[role_code] = role

            # Assign permissions based on matrix
            for module, scope in matrix.items():
                if scope and module in permissions_by_module:
                    for perm in permissions_by_module[module]:
                        rp = (
                            db.query(RolePermission)
                            .filter_by(role_id=role.id, permission_id=perm.id)
                            .first()
                        )
                        if not rp:
                            rp = RolePermission(
                                role_id=role.id,
                                permission_id=perm.id,
                                scope=scope,
                            )
                            db.add(rp)
            db.commit()

        # 4. Portal Roles
        for pcode, pdesc in PORTAL_ROLES.items():
            prole = db.query(Role).filter_by(code=pcode).first()
            if not prole:
                prole = Role(
                    organization_id=org.id,
                    name=pcode.replace("_", " ").title(),
                    code=pcode,
                    description=pdesc,
                    is_system=True,
                    role_type="client",
                )
                db.add(prole)
                db.commit()
                db.refresh(prole)

        # 5. Super Admin User
        admin_email = settings.SUPER_ADMIN_EMAIL.lower()
        admin_user = db.query(User).filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                organization_id=org.id,
                email=admin_email,
                hashed_password=hash_password(settings.SUPER_ADMIN_PASSWORD),
                first_name="Sai",
                last_name="Varshith",
                phone="+91 98765 43210",
                user_type="internal",
                is_active=True,
                is_suspended=False,
                is_super_admin=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            # Assign Super Admin Role
            super_role = role_objs["super_admin"]
            ur = UserRole(user_id=admin_user.id, role_id=super_role.id)
            db.add(ur)
            db.commit()
            print(f"Created Super Admin: {admin_email}")
        else:
            admin_user.first_name = "Sai"
            admin_user.last_name = "Varshith"
            db.commit()

        # 6. Service Catalogue (Web, App, SEO, Social, Branding, CRM/ERP, EdTech)
        catalogue_items = [
            (
                "Custom Web Application",
                "WEB-CUSTOM",
                "web",
                "Full stack custom web app built on Next.js & Python",
                "fixed",
                8000000,
            ),  # ₹80,000
            (
                "Enterprise Mobile App (iOS/Android)",
                "APP-CROSS",
                "app",
                "React Native / Flutter production mobile app",
                "fixed",
                15000000,
            ),  # ₹1,50,000
            (
                "Search Engine Optimization (SEO)",
                "SEO-MONTHLY",
                "seo",
                "Technical SEO, keyword strategy and backlink growth",
                "subscription",
                3000000,
            ),  # ₹30,000/mo
            (
                "Social Media Marketing & Growth",
                "SOCIAL-MONTHLY",
                "social",
                "Content creation, campaign design and social management",
                "subscription",
                2000000,
            ),  # ₹20,000/mo
            (
                "Branding & Corporate Identity",
                "BRAND-ID",
                "branding",
                "Logo, typography, design system, brand manifesto",
                "fixed",
                4500000,
            ),  # ₹45,000
            (
                "Custom CRM / ERP Platform",
                "CRM-ERP-SYS",
                "crm_erp",
                "End-to-end bespoke operational ERP & CRM suite",
                "custom",
                12000000,
            ),  # ₹1,20,000
            (
                "EdTech LMS Platform",
                "EDTECH-LMS",
                "edtech",
                "Student management, video classes, test engine",
                "custom",
                20000000,
            ),  # ₹2,00,000
        ]
        services_dict = {}
        for name, code, category, desc, p_type, price in catalogue_items:
            svc = db.query(ServiceCatalogue).filter_by(code=code).first()
            if not svc:
                svc = ServiceCatalogue(
                    name=name,
                    code=code,
                    category=category,
                    description=desc,
                    pricing_type=p_type,
                    default_price_paise=price,
                    currency="INR",
                    hsn_sac_code="998314",
                    is_active=True,
                )
                db.add(svc)
                db.commit()
                db.refresh(svc)
            services_dict[code] = svc

        # 7. Sample Client Organization and Client 360 Records (Dev/Demo Only)
        skip_demo = "--core-only" in sys.argv or settings.is_production
        if not skip_demo:
            sample_client = db.query(Client).filter_by(code="CLI-APEX-001").first()
            if not sample_client:
            sample_client = Client(
                organization_id=org.id,
                name="Apex Global Technologies",
                brand_name="Apex Tech",
                code="CLI-APEX-001",
                status="active",
                gstin="27AAACA1234F1Z1",
                website="https://apextech.example.com",
                industry="Information Technology",
                address="Tower B, Cyber City, Mumbai, MH",
                city="Mumbai",
                state="Maharashtra",
                country="India",
                postal_code="400051",
                account_manager_id=admin_user.id,
            )
            db.add(sample_client)
            db.commit()
            db.refresh(sample_client)

            # Client primary contact
            c_contact = ClientContact(
                client_id=sample_client.id,
                name="Vikram Mehta",
                email="vikram@apextech.example.com",
                phone="+91 98200 11223",
                designation="Chief Technology Officer",
                is_primary=True,
            )
            db.add(c_contact)

            # Subscribed Services
            sub_web = ClientService(
                client_id=sample_client.id,
                service_id=services_dict["WEB-CUSTOM"].id,
                status="active",
                price_paise=8000000,
                billing_cycle="one_time",
                start_date=datetime.date.today() - datetime.timedelta(days=30),
            )
            sub_seo = ClientService(
                client_id=sample_client.id,
                service_id=services_dict["SEO-MONTHLY"].id,
                status="active",
                price_paise=3000000,
                billing_cycle="monthly",
                start_date=datetime.date.today() - datetime.timedelta(days=15),
            )
            sub_social = ClientService(
                client_id=sample_client.id,
                service_id=services_dict["SOCIAL-MONTHLY"].id,
                status="active",
                price_paise=2000000,
                billing_cycle="monthly",
                start_date=datetime.date.today() - datetime.timedelta(days=15),
            )
            sub_crm = ClientService(
                client_id=sample_client.id,
                service_id=services_dict["CRM-ERP-SYS"].id,
                status="active",
                price_paise=12000000,
                billing_cycle="one_time",
                start_date=datetime.date.today() - datetime.timedelta(days=10),
            )
            db.add_all([sub_web, sub_seo, sub_social, sub_crm])
            db.commit()

            # Sample Project
            proj = Project(
                client_id=sample_client.id,
                client_service_id=sub_web.id,
                name="Apex Global Corporate Portal & Brand Redesign",
                code="PRJ-APEX-WEB",
                description="Next.js corporate website, responsive UI, multi-region SEO integration and client dashboard.",
                status="in_progress",
                priority="high",
                manager_id=admin_user.id,
                start_date=datetime.date.today() - datetime.timedelta(days=20),
                due_date=datetime.date.today() + datetime.timedelta(days=40),
                progress_percent=65,
                budget_paise=8000000,
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

            # Milestones
            m1 = Milestone(
                project_id=proj.id,
                title="Phase 1: Architecture & UX Wireframes",
                due_date=datetime.date.today() - datetime.timedelta(days=5),
                is_completed=True,
                completed_at=datetime.datetime.now(datetime.UTC),
                order_index=1,
            )
            m2 = Milestone(
                project_id=proj.id,
                title="Phase 2: Frontend & API Integration",
                due_date=datetime.date.today() + datetime.timedelta(days=15),
                is_completed=False,
                order_index=2,
            )
            db.add_all([m1, m2])
            db.commit()
            db.refresh(m1)
            db.refresh(m2)

            # Tasks
            t1 = Task(
                project_id=proj.id,
                milestone_id=m1.id,
                title="Design System & Token Architecture",
                description="Establish typography, color palette, responsive layout breakpoints and component states.",
                status="completed",
                priority="high",
                owner_id=admin_user.id,
                estimated_hours=16.0,
                logged_hours=16.0,
                is_client_visible=True,
            )
            t2 = Task(
                project_id=proj.id,
                milestone_id=m2.id,
                title="Implement Client 360 & Project Management UI",
                description="Connect Next.js client pages to FastAPI endpoints with RBAC authorization checks.",
                status="in_progress",
                priority="urgent",
                owner_id=admin_user.id,
                estimated_hours=24.0,
                logged_hours=12.0,
                is_client_visible=True,
            )
            db.add_all([t1, t2])
            db.commit()

            # Sample Invoice with Indian GST
            inv = Invoice(
                invoice_number="INV-2026-0001",
                client_id=sample_client.id,
                project_id=proj.id,
                issue_date=datetime.date.today() - datetime.timedelta(days=5),
                due_date=datetime.date.today() + datetime.timedelta(days=15),
                status="issued",
                subtotal_paise=8000000,  # ₹80,000
                discount_paise=0,
                cgst_paise=720000,  # 9% = ₹7,200
                sgst_paise=720000,  # 9% = ₹7,200
                igst_paise=0,
                total_tax_paise=1440000,  # 18% = ₹14,400
                total_paise=9440000,  # ₹94,400
                amount_paid_paise=0,
                balance_paise=9440000,
                currency="INR",
                gst_type="intra_state",
                client_name_snapshot=sample_client.name,
                client_gstin_snapshot=sample_client.gstin,
                client_address_snapshot=sample_client.address,
                issued_at=datetime.datetime.now(datetime.UTC),
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

            inv_item = InvoiceLineItem(
                invoice_id=inv.id,
                description="Custom Web Application Development (Phase 1 Advance)",
                hsn_sac_code="998314",
                quantity=1,
                unit_price_paise=8000000,
                tax_rate_percent=18,
                tax_amount_paise=1440000,
                total_paise=9440000,
            )
            db.add(inv_item)
            db.commit()
            print("Seeded sample client, services, project, milestones, tasks, and invoice.")
        else:
            print("Core foundation seeded cleanly (Skipped demo data).")

        print("Database seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
