"""Seed reference mock records from Digital Footprint OS design PDF.

Guard: This script may ONLY execute when APP_ENV=development.
"""

import datetime
import os
import sys

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.db.models import (
    Client,
    ClientContact,
    ClientService,
    Contract,
    Deliverable,
    Invoice,
    Lead,
    Organization,
    Project,
    Role,
    ServiceCatalogue,
    Task,
    User,
    UserRole,
)


def seed_pdf() -> None:
    """Populate reference mock data for local development only."""
    app_env = os.getenv("APP_ENV", settings.APP_ENV).lower()
    if app_env not in ("development", "dev", "local"):
        print(f"ERROR: Refusing to seed mock PDF data in '{app_env}' environment.", file=sys.stderr)
        print("This script is restricted to local development only.", file=sys.stderr)
        sys.exit(1)

    db: Session = SessionLocal()
    try:
        org = db.query(Organization).first()
        if not org:
            org = Organization(name="Digital Footprint", slug="digitalfootprint")
            db.add(org)
            db.commit()
            db.refresh(org)

        # 1. Staff Members: Meera, Karan, Divya
        staff_members = [
            ("meera@digitalfootprint.in", "Meera", "Sharma", "Project Manager"),
            ("karan@digitalfootprint.in", "Karan", "Verma", "Developer"),
            ("divya@digitalfootprint.in", "Divya", "Reddy", "Designer"),
        ]
        staff_dict = {}
        for email, fn, ln, _desig in staff_members:
            u = db.query(User).filter_by(email=email).first()
            if not u:
                u = User(
                    organization_id=org.id,
                    email=email,
                    hashed_password=hash_password("Staff@12345!"),
                    first_name=fn,
                    last_name=ln,
                    user_type="internal",
                    is_active=True,
                )
                db.add(u)
                db.commit()
                db.refresh(u)
            staff_dict[fn] = u

        # 2. Key Accounts
        accounts_data = [
            (
                "Peak Fitness",
                "CLI-PEAK-001",
                "Fitness",
                "+91 98765 43210",
                "peakfitness.in",
                "Bengaluru",
                "Meera",
            ),
            (
                "Akshara Enterprises",
                "CLI-AKSHARA-01",
                "Manufacturing",
                "+91 98450 12345",
                "akshara.in",
                "Hyderabad",
                "Karan",
            ),
            (
                "Nova Learning",
                "CLI-NOVA-001",
                "EdTech",
                "+91 97312 34567",
                "novalearning.com",
                "Bengaluru",
                "Meera",
            ),
            (
                "Greenleaf Organics",
                "CLI-GREEN-001",
                "FMCG",
                "+91 98860 98765",
                "greenleaforganics.in",
                "Chennai",
                "Karan",
            ),
            (
                "Bloom Dental Clinic",
                "CLI-BLOOM-001",
                "Healthcare",
                "+91 99001 22334",
                "bloomdental.in",
                "Bengaluru",
                "Karan",
            ),
            (
                "Mehta Interiors",
                "CLI-MEHTA-001",
                "Design",
                "+91 98220 55667",
                "mehtainteriors.in",
                "Mumbai",
                "Meera",
            ),
        ]
        clients_dict = {}
        for name, code, ind, phone, web, city, mgr_name in accounts_data:
            c = db.query(Client).filter_by(code=code).first()
            if not c:
                c = Client(
                    organization_id=org.id,
                    name=name,
                    brand_name=name,
                    code=code,
                    industry=ind,
                    city=city,
                    website=web,
                    status="active",
                    account_manager_id=staff_dict.get(mgr_name).id
                    if staff_dict.get(mgr_name)
                    else None,
                )
                db.add(c)
                db.commit()
                db.refresh(c)
            clients_dict[name] = c

        # 3. Primary Contact & Portal User for Peak Fitness (Arjun S)
        peak = clients_dict["Peak Fitness"]
        arjun_contact = (
            db.query(ClientContact)
            .filter_by(client_id=peak.id, email="arjun@peakfitness.in")
            .first()
        )
        if not arjun_contact:
            arjun_contact = ClientContact(
                client_id=peak.id,
                name="Arjun S",
                email="arjun@peakfitness.in",
                phone="+91 98765 43210",
                designation="Owner",
                is_primary=True,
            )
            db.add(arjun_contact)
            db.commit()
            db.refresh(arjun_contact)

        arjun_user = db.query(User).filter_by(email="arjun@peakfitness.in").first()
        if not arjun_user:
            arjun_user = User(
                organization_id=org.id,
                email="arjun@peakfitness.in",
                hashed_password=hash_password("Password@123"),
                first_name="Arjun",
                last_name="S",
                phone="+91 98765 43210",
                user_type="client",
                is_active=True,
            )
            db.add(arjun_user)
            db.commit()
            db.refresh(arjun_user)
            arjun_contact.user_id = arjun_user.id
            db.commit()

            client_role = db.query(Role).filter_by(code="client_owner").first()
            if client_role:
                db.add(UserRole(user_id=arjun_user.id, role_id=client_role.id))
                db.commit()

        # 4. Peak Fitness Subscribed Services
        peak_services = [
            ("Website development", 8000000, "one_time"),
            ("SEO", 3000000, "monthly"),
            ("Social media management", 2000000, "monthly"),
            ("Custom CRM", 12000000, "one_time"),
        ]
        for sname, paise, cycle in peak_services:
            cat = (
                db.query(ServiceCatalogue).filter(ServiceCatalogue.name.ilike(f"%{sname}%")).first()
            )
            if not cat:
                cat = ServiceCatalogue(
                    name=sname,
                    code=sname.upper()[:8].replace(" ", "_"),
                    category="web",
                    default_price_paise=paise,
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
            cs = db.query(ClientService).filter_by(client_id=peak.id, service_id=cat.id).first()
            if not cs:
                cs = ClientService(
                    client_id=peak.id,
                    service_id=cat.id,
                    price_paise=paise,
                    billing_cycle=cycle,
                    status="active",
                    start_date=datetime.date(2026, 10, 1),
                )
                db.add(cs)
                db.commit()

        # 5. Peak Fitness Project: Website redesign
        proj = db.query(Project).filter_by(code="PRJ-PEAK-WEB").first()
        if not proj:
            proj = Project(
                client_id=peak.id,
                name="Website redesign",
                code="PRJ-PEAK-WEB",
                description="Custom high-conversion fitness platform and membership portal.",
                status="internal_review",
                priority="high",
                manager_id=staff_dict["Meera"].id,
                start_date=datetime.date(2026, 10, 15),
                due_date=datetime.date(2026, 11, 30),
                progress_percent=65,
                budget_paise=8000000,
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

            tasks_data = [
                ("Contact page copy", "todo", "medium", staff_dict["Divya"].id),
                ("Pricing page", "in_progress", "high", staff_dict["Karan"].id),
                ("Mobile menu fix", "in_progress", "low", staff_dict["Karan"].id),
                ("Home page design", "in_review", "high", staff_dict["Meera"].id),
                ("Wireframes", "completed", "medium", staff_dict["Divya"].id),
                ("Brand colors", "completed", "low", staff_dict["Meera"].id),
            ]
            for title, st, prio, uid in tasks_data:
                t = Task(
                    project_id=proj.id,
                    title=title,
                    status=st,
                    priority=prio,
                    owner_id=uid,
                    is_client_visible=True,
                )
                db.add(t)
            db.commit()

            deliv = Deliverable(
                project_id=proj.id,
                title="Home page design, version 2",
                file_url="https://crm.digitalfootprint.in/deliverables/peak-fitness-homepage-v2.pdf",
                version=2,
                status="pending_approval",
            )
            db.add(deliv)
            db.commit()

        # 6. Peak Fitness Invoices: DF-2026-0002 (₹70,000 Due Nov 20), DF-2026-0001 (₹90,000 Paid)
        inv2 = db.query(Invoice).filter_by(invoice_number="DF-2026-0002").first()
        if not inv2:
            inv2 = Invoice(
                invoice_number="DF-2026-0002",
                client_id=peak.id,
                issue_date=datetime.date(2026, 11, 1),
                due_date=datetime.date(2026, 11, 20),
                status="issued",
                subtotal_paise=5932200,
                total_tax_paise=1067800,
                total_paise=7000000,
                amount_paid_paise=0,
                balance_paise=7000000,
                client_name_snapshot="Peak Fitness",
            )
            db.add(inv2)

        inv1 = db.query(Invoice).filter_by(invoice_number="DF-2026-0001").first()
        if not inv1:
            inv1 = Invoice(
                invoice_number="DF-2026-0001",
                client_id=peak.id,
                issue_date=datetime.date(2026, 10, 5),
                due_date=datetime.date(2026, 10, 25),
                status="paid",
                subtotal_paise=7627100,
                total_tax_paise=1372900,
                total_paise=9000000,
                amount_paid_paise=9000000,
                balance_paise=0,
                client_name_snapshot="Peak Fitness",
            )
            db.add(inv1)
        db.commit()

        # 7. Service Agreements
        agreements = [
            (
                "DFA-2026-0007",
                "Peak Fitness",
                "Website + SEO",
                11000000,
                datetime.date(2026, 11, 4),
                False,
                "sent",
            ),
            (
                "DFA-2026-0006",
                "Akshara Enterprises",
                "CRM development",
                12000000,
                datetime.date(2026, 10, 22),
                True,
                "signed",
            ),
            (
                "DFA-2026-0005",
                "Nova Learning",
                "EdTech platform",
                24000000,
                datetime.date(2026, 10, 18),
                True,
                "signed",
            ),
            (
                "DFA-2026-0004",
                "Greenleaf Organics",
                "Social media",
                2000000,
                datetime.date(2026, 10, 10),
                False,
                "sent",
            ),
            ("DFA-2026-0003", "Bloom Dental Clinic", "SEO", 3000000, None, False, "draft"),
            (
                "DFA-2026-0002",
                "Mehta Interiors",
                "Branding",
                6000000,
                datetime.date(2026, 9, 28),
                True,
                "expired",
            ),
        ]
        for agr_no, cl_name, title, paise, sdate, signed_copy, st in agreements:
            existing = db.query(Contract).filter_by(contract_number=agr_no).first()
            cl_obj = clients_dict.get(cl_name) or peak
            if not existing:
                ctr = Contract(
                    contract_number=agr_no,
                    client_id=cl_obj.id,
                    title=title,
                    start_date=sdate or datetime.date.today(),
                    value_paise=paise,
                    status=st,
                    signed_copy_received=signed_copy,
                    sent_date=sdate,
                    terms_summary="Standard Digital Footprint master service terms with 30-day billing SLA.",
                )
                db.add(ctr)
        db.commit()

        # 8. Leads
        leads_data = [
            (
                "Sri Venkata Traders",
                "Ravi K",
                "ravi@srivenkata.in",
                "Website",
                "new",
                staff_dict["Meera"].id,
                4200000,
            ),
            (
                "Bloom Dental Clinic",
                "Dr. Anita",
                "anita@bloomdental.in",
                "SEO",
                "contacted",
                staff_dict["Karan"].id,
                3000000,
            ),
            (
                "Nova Learning",
                "Suresh P",
                "suresh@novalearning.com",
                "EdTech",
                "qualified",
                staff_dict["Meera"].id,
                7500000,
            ),
            (
                "Greenleaf Organics",
                "Divya R",
                "divya@greenleaforganics.in",
                "Social media",
                "proposal_sent",
                staff_dict["Karan"].id,
                2400000,
            ),
            (
                "Lakshmi Silks",
                "Mohan T",
                "mohan@lakshmisilks.in",
                "E-commerce",
                "negotiation",
                staff_dict["Meera"].id,
                5000000,
            ),
            (
                "Mehta Interiors",
                "Rahul M",
                "rahul@mehtainteriors.in",
                "Branding",
                "qualified",
                staff_dict["Karan"].id,
                1800000,
            ),
            (
                "Quick Courier",
                "Imran S",
                "imran@quickcourier.in",
                "CRM",
                "new",
                staff_dict["Meera"].id,
                3500000,
            ),
            (
                "Aster Tutorials",
                "Neha G",
                "neha@astertutorials.in",
                "EdTech",
                "contacted",
                staff_dict["Karan"].id,
                4500000,
            ),
        ]
        for company, contact, email, _svc, st, uid, val in leads_data:
            existing_lead = db.query(Lead).filter_by(title=company).first()
            if not existing_lead:
                ld = Lead(
                    organization_id=org.id,
                    title=company,
                    company_name=company,
                    contact_name=contact,
                    email=email,
                    status=st,
                    assigned_to_id=uid,
                    estimated_value_paise=val,
                )
                db.add(ld)
        db.commit()

        print("Seeded all 8 PDF screens data successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_pdf()
