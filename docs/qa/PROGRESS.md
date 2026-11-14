# QA & Implementation Progress (PROGRESS.md)

This document tracks progress phase by phase through the Digital Footprint OS (DCRM) completion and QA loop.

---

## Phase 0: Setup, Baseline, and Audit Confirmation

### Gate Checklist
- [x] App runs locally against Neon PostgreSQL (`ep-sweet-river-be09l8ou`), and the seed succeeds
- [x] Initial codebase and toolchain inspected (`uv`, `python 3.12`, `pnpm`, `next 15`)
- [x] `docs/qa/` created with `AUDIT.md`, `BUGS.md`, and `PROGRESS.md`
- [x] All backlog findings B-01 through B-17 and F-01 through F-14 verified and confirmed with exact root causes in `AUDIT.md`
- [x] New findings documented (B-18 through B-21, F-15 through F-16)
- [x] Alembic migration `330814f38817_add_missing_contract_columns` generated and applied
- [x] Both `seed.py` and `seed_pdf_data.py` executed successfully against live Neon DB
- [x] Backend running on `http://127.0.0.1:8000` (`/api/v1/health` status: ok)
- [x] Frontend running on `http://localhost:3000` (status: 200)
- [x] Super admin authentication confirmed (`admin@digitalfootprint.in`)
- [x] "What changed and why" note written for the undergraduate developer

### Command Outputs & Evidence
- **Neon Database Connection:** Connected via pure-Python driver `pg8000` with SSL context against `ep-sweet-river-be09l8ou-pooler.c-9.us-east-2.aws.neon.tech/neondb`.
- **Alembic Status:**
  - `Running upgrade -> f30c91f1e3a3, initial_schema` (42 tables created).
  - `Running upgrade f30c91f1e3a3 -> 330814f38817, add_missing_contract_columns` (`signed_copy_received` and `sent_date` added).
- **Database Counts:**
  - `users`: 5
  - `clients`: 7
  - `contracts`: 6
  - `projects`: 2
  - `tasks`: 8
  - `invoices`: 3
  - `permissions`: 34
  - `roles`: 12
  - `role_permissions`: 172
- **Backend Health Check:**
  ```json
  {
      "status": "ok",
      "service": "Digital Footprint OS API",
      "version": "1.0.0"
  }
  ```
- **Login Verification:**
  `POST /api/v1/auth/login` for `admin@digitalfootprint.in` returns HTTP 200 with session cookie `df_session`, full permissions array, and `home_route: "/internal/dashboard"`.
- **Frontend Build & Dev Server:**
  `pnpm build` verified 29/29 routes statically compiled. `pnpm dev` listening on `http://localhost:3000` (HTTP 200).

### For the Undergraduate Developer — What changed and why
- **How we connected to Neon PostgreSQL:**
  Neon is a serverless cloud PostgreSQL database. We configured `apps/api/.env` with the pooled connection URL for the API runtime and direct URL for schema migrations. To ensure seamless connectivity without triggering Windows Application Control DLL blocks, we used `pg8000`, a clean, pure-Python driver that supports PostgreSQL TLS and connection pooling natively.
- **Why we needed a new Alembic migration for contracts:**
  While running `seed_pdf_data.py`, we found that the `Contract` model in code had two fields (`signed_copy_received` and `sent_date`) that were omitted from the original migration. Following Rule R7 (never change applied migrations, never use `create_all`), we generated a clean Alembic migration `330814f38817_add_missing_contract_columns.py` and upgraded the database schema cleanly.
- **Why we verified the Super Admin login API:**
  Checking login at the API boundary proves that our database connection, password hashing (Argon2id), session management, and role-permission queries all work in harmony against real cloud data before writing any new feature code.

---
