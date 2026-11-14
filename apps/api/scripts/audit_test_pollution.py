"""Read-only test pollution audit script for Digital Footprint OS.

Identifies test-generated records in the development database resulting
from running test suites against the un-isolated development database.
"""

from __future__ import annotations

import os
import ssl
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

load_dotenv()


def main() -> int:
    url = os.getenv("DATABASE_DIRECT_URL") or os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_DIRECT_URL / DATABASE_URL not set.")
        return 1

    connect_args = {}
    u = make_url(url)
    if "pg8000" in url or "neon.tech" in (u.host or ""):
        connect_args["ssl_context"] = ssl.create_default_context()

    engine = create_engine(url, connect_args=connect_args)

    print("=" * 70)
    print(" Digital Footprint OS (DCRM) — Dev DB Contamination Audit")
    print("=" * 70)

    pollution_found: list[dict[str, str]] = []

    with engine.connect() as conn:
        # 1. Test Invoices (e.g. INV-TEST-099)
        test_invoices = conn.execute(
            text(
                "SELECT id, invoice_number, created_at FROM invoices WHERE invoice_number LIKE '%TEST%'"
            )
        ).fetchall()
        for r in test_invoices:
            pollution_found.append(
                {
                    "table": "invoices",
                    "id": str(r[0]),
                    "identifier": f"invoice_number='{r[1]}'",
                    "created_at": str(r[2]),
                    "reason": "Created by test_invoice_gst_calculation",
                }
            )

        # 2. Test Clients (e.g. CLI-TEST-001 or CLI-ZENITH-01 from tests)
        test_clients = conn.execute(
            text(
                "SELECT id, code, name, created_at FROM clients "
                "WHERE code LIKE '%TEST%' OR name LIKE '%Test%' OR code = 'CLI-ZENITH-01'"
            )
        ).fetchall()
        for r in test_clients:
            pollution_found.append(
                {
                    "table": "clients",
                    "id": str(r[0]),
                    "identifier": f"code='{r[1]}', name='{r[2]}'",
                    "created_at": str(r[3]),
                    "reason": "Created by test_lead_conversion_idempotence",
                }
            )

        # 3. Test Client Contacts linked to test clients
        if test_clients:
            client_ids_list = [str(r[0]) for r in test_clients]
            test_contacts = conn.execute(
                text(
                    "SELECT id, name, email, created_at FROM client_contacts "
                    "WHERE client_id = ANY(:cids)"
                ),
                {"cids": client_ids_list},
            ).fetchall()
            for r in test_contacts:
                pollution_found.append(
                    {
                        "table": "client_contacts",
                        "id": str(r[0]),
                        "identifier": f"name='{r[1]}', email='{r[2]}'",
                        "created_at": str(r[3]),
                        "reason": "Primary contact created during test lead conversion",
                    }
                )

        # 4. Test Leads
        test_leads = conn.execute(
            text(
                "SELECT id, title, email, created_at FROM leads "
                "WHERE title LIKE '%Test%' OR email LIKE '%test%' OR email = 'rohan@zenithlogistics.in'"
            )
        ).fetchall()
        for r in test_leads:
            pollution_found.append(
                {
                    "table": "leads",
                    "id": str(r[0]),
                    "identifier": f"title='{r[1]}', email='{r[2]}'",
                    "created_at": str(r[3]),
                    "reason": "Lead created by test_lead_conversion_idempotence",
                }
            )

        # 5. Test Audit Logs
        test_audits = conn.execute(
            text(
                "SELECT id, action, resource_type, resource_id, timestamp FROM audit_logs "
                "WHERE action LIKE '%test%' OR new_values LIKE '%TEST%' OR new_values LIKE '%ZENITH%'"
            )
        ).fetchall()
        for r in test_audits:
            pollution_found.append(
                {
                    "table": "audit_logs",
                    "id": str(r[0]),
                    "identifier": f"action='{r[1]}', res={r[2]}:{r[3]}",
                    "created_at": str(r[4]),
                    "reason": "Audit record generated during test lead conversion / test invoice write",
                }
            )

        # 6. Test User Sessions
        test_sessions = conn.execute(
            text(
                "SELECT id, user_id, created_at FROM user_sessions WHERE user_agent LIKE '%testclient%'"
            )
        ).fetchall()
        for r in test_sessions:
            pollution_found.append(
                {
                    "table": "user_sessions",
                    "id": str(r[0]),
                    "identifier": f"user_id='{r[1]}'",
                    "created_at": str(r[2]),
                    "reason": "Session created during test_login_success via Starlette TestClient",
                }
            )

    print(f"\nAudit complete. Total suspicious rows detected: {len(pollution_found)}\n")
    if pollution_found:
        print(f"{'Table':<16} | {'Row ID':<36} | {'Details / Reason'}")
        print("-" * 90)
        for row in pollution_found:
            print(f"{row['table']:<16} | {row['id']:<36} | {row['identifier']} ({row['reason']})")
    else:
        print("[CLEAN] Zero test pollution rows detected in the development database.")

    print("\n" + "=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
