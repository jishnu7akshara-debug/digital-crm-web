"""Purge dummy/seed business data from live development database (neondb).
Strictly preserves:
- organizations
- roles, permissions, role_permissions
- Super Admin user (admin@digitalfootprint.in) & user_roles
- service_catalogue
- document_sequences definitions (reset last_value to 0)
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def cleanup():
    db_url = settings.DATABASE_URL
    print(f"Target Database: {db_url.split('@')[-1]}")
    engine = create_engine(db_url)

    tables_to_truncate = [
        "audit_logs",
        "login_attempts",
        "user_sessions",
        "deliverables",
        "tasks",
        "milestones",
        "project_members",
        "projects",
        "credit_notes",
        "payments",
        "invoice_line_items",
        "invoices",
        "contracts",
        "proposals",
        "lead_activities",
        "leads",
        "support_ticket_comments",
        "support_tickets",
        "attendance",
        "timesheets",
        "leaves",
        "employees",
        "client_services",
        "client_contacts",
        "clients",
    ]

    with engine.begin() as conn:
        print("Cleaning up operational and transactional dummy tables...")
        for table in tables_to_truncate:
            try:
                # Check if table exists
                exists = conn.execute(
                    text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :t)"),
                    {"t": table}
                ).scalar()
                if exists:
                    deleted = conn.execute(text(f'DELETE FROM "{table}"')).rowcount
                    print(f"  [CLEARED] {table}: {deleted} rows removed")
            except Exception as e:
                print(f"  [ERROR] {table}: {e}")

        # Clean up non-admin dummy users, preserving admin@digitalfootprint.in
        print("\nCleaning up non-admin dummy users...")
        admin_id = conn.execute(
            text("SELECT id FROM users WHERE email = 'admin@digitalfootprint.in'")
        ).scalar()

        if admin_id:
            # Delete user_roles for all users except admin
            conn.execute(
                text("DELETE FROM user_roles WHERE user_id != :admin_id"),
                {"admin_id": admin_id}
            )
            # Delete users except admin
            deleted_users = conn.execute(
                text("DELETE FROM users WHERE id != :admin_id"),
                {"admin_id": admin_id}
            ).rowcount
            print(f"  [PRESERVED] Super Admin (admin@digitalfootprint.in, id={admin_id})")
            print(f"  [REMOVED] {deleted_users} dummy user accounts")
        else:
            print("  [WARNING] admin@digitalfootprint.in not found; skipping user purge")

        # Reset document sequences to 0
        try:
            conn.execute(text("UPDATE document_sequences SET last_value = 0"))
            print("  [RESET] document_sequences last_value reset to 0")
        except Exception as e:
            print(f"  [WARNING] document_sequences reset error: {e}")

    print("\nDatabase cleanup complete! Fresh operational slate established.")

if __name__ == "__main__":
    cleanup()
