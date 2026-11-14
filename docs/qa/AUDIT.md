# Phase 0 Baseline Audit (AUDIT.md)

**Date:** 2026-11-14  
**Auditor:** Senior Backend & UI/UX Engineer (Antigravity)  
**Target:** Digital Footprint OS (DCRM)

---

## 1. System & Environment Baseline

| Tool | Version / Status | Notes |
|------|------------------|-------|
| OS | Windows 11 (AMD64) | Smart App Control (SAC) Enforced (`VerifiedAndReputablePolicyState: 1`, `SmartAppControlState: On`) |
| Python | 3.12.10 | Active virtual environment at `apps/api/.venv` |
| uv | 0.12.23 | Fast Python package management |
| Node.js | v24.19.0 | |
| pnpm | 12.6.0 | Installed all dependencies in `apps/web` |
| Next.js | 15.5.29 | React 19.3.1, Tailwind 3.4.19 |
| Docker | 29.8.0 | Daemon not running |
| WSL | Not installed | Native Windows execution |

### 1.2 Dev DB Contamination Audit (§2.3)

Identified via `python -m scripts.audit_test_pollution`:

| Table | Suspicious Row ID | How Identified | Proposed Action |
|---|---|---|---|
| `invoices` | `81284fd4-9430-4502-9de8-7d6c7aa5ee96` | `invoice_number='INV-TEST-099'` (from `test_invoice_gst_calculation`) | Option A: Reset dev branch / Option B: Delete test invoice & line items |
| `clients` | `5c3ef2f4-e34d-47b3-809b-c6cfb32f5a72` | `code='CLI-ZENITH-01'` (from `test_lead_conversion_idempotence`) | Option A: Reset dev branch / Option B: Delete test client |
| `client_contacts` | `6abde056-2baa-46b9-bb5a-05e96a5039c8` | `name='Rohan Deshmukh'` linked to `CLI-ZENITH-01` | Option A: Reset dev branch / Option B: Delete test contact |
| `leads` | `31f51560-d11b-456f-8c92-4267bae6a9a9` | `title='Inbound Enterprise ERP Inquiry'` from lead convert test | Option A: Reset dev branch / Option B: Delete test lead |
| `audit_logs` | `2ec6199c-1068-4f1c-ba42-fd9a4716594f` | `action='invoice.issue'` referencing test invoice ID | Option A: Reset dev branch / Option B: Delete test audit entry |
| `user_sessions` | `f3bb1754-aebf-45a3-90e4-393a15c4017b` | TestClient user agent from `test_login_success` | Option A: Reset dev branch / Option B: Revoke test session |
| `user_sessions` | `4d65286e-94c8-44f1-9ca6-46af210ac4f5` | TestClient user agent from `test_login_success` | Option A: Reset dev branch / Option B: Revoke test session |

**Proposed Cleanup Choices for Owner:**
- **Option A (Preferred):** Recreate/reset Neon `dev` branch, then `alembic upgrade head && python seed.py`. Clean, deterministic, zero leftover artifacts.
- **Option B:** Run targeted cleanup script `apps/api/scripts/cleanup_test_pollution.py` in single transaction (dry-run on by default).

*(Awaiting Owner decision before executing cleanup).*

### 1.3 Real Client Data Audit & Repository Privacy (§2.5)

- **Git Remote Audit:** Executed `git remote -v`. Output is empty (0 remotes configured; the repository is strictly local and has not been pushed to GitHub or any public remote).
- **Reference Mock Data Categories (from `seed_pdf_data.py`):**
  - *Staff Members:* Meera Sharma, Karan Verma, Divya Reddy (`@digitalfootprint.in`).
  - *Client Accounts:* Peak Fitness, Akshara Enterprises, Nova Learning, Greenleaf Organics, Bloom Dental Clinic, Mehta Interiors.
  - *Client Contacts:* Arjun S (`arjun@peakfitness.in`, test phone `+91 98765 43210`).
  - *Subscribed Services:* Web development (₹80k), SEO (₹30k/mo), Social media (₹20k/mo), Custom CRM (₹1.2L).
  - *Invoices & Agreements:* DF-2026-0001, DF-2026-0002, DFA-2026-0002 through DFA-2026-0007.
  - *Leads Pipeline:* 8 records with company and contact names from design PDF.
- **Data Safety Assessment:** All items are mock design artifacts representing an agency portfolio reference mock rather than active client PII or live credentials. No production secrets, live payment keys, or personal passwords exist in the dataset.
- **Data Handling Policy Implemented:**
  1. Relocated `seed_pdf_data.py` to `apps/api/scripts/dev_only/seed_pdf_data.py`.
  2. Guarded with mandatory `APP_ENV=development` check; aborts with exit code 1 if invoked in any other environment.
  3. Completely isolated from production migrations and deployment scripts.

---

Direct empirical outputs from the active shell:

```text
> python -c "import sys, platform; print(sys.executable); print(platform.platform()); print(sys.version)"
C:\coding\digital foot crm\DCRM\apps\api\.venv\Scripts\python.exe
Windows-11-10.0.26300-SP0
3.12.10 (tags/v3.12.10:0cc8128, Apr  8 2025, 12:21:36) [MSC v.1943 64 bit (AMD64)]

> python -c "import psycopg; print('psycopg', psycopg.__version__, psycopg.pq.__impl__)"
ImportError: no pq wrapper available.
Attempts made:
- couldn't import psycopg 'c' implementation: No module named 'psycopg_c'
- couldn't import psycopg 'binary' implementation: DLL load failed while importing pq: An Application Control policy has blocked this file.
- couldn't import psycopg 'python' implementation: libpq library not found

> python -c "import argon2, _argon2_cffi_bindings; print('argon2 ok', argon2.__version__)"
argon2 ok 25.1.0

> python -c "import mypy.api; print('mypy import ok')"
mypy import ok

> Get-MpComputerStatus | Select-Object SmartAppControlState
SmartAppControlState: On
```

**Runtime Truth Verdict:**
All backend operations, database connections, and test runs in this session were executed natively on **Windows 11 (build 26300)** under Python 3.12.10 inside `apps/api/.venv`.
- `psycopg` native `libpq.dll` is actively blocked by Windows Smart App Control (`SmartAppControlState: On`).
- `argon2` / `_argon2_cffi_bindings` and `mypy` work reliably after clean reinstallation into the virtual environment.
- On Windows with SAC enabled, database queries and migrations execute through `pg8000` (pure-Python TLS driver). When deployed to Linux/Vercel or executed in WSL2, `psycopg` is the target driver.

---

## 2. Command Line Sweep Results

### 2.1 Backend (`apps/api`)

- **`uv pip install -e ".[dev]"`**: Succeeded (62 packages installed).
- **`python -m scripts.check_env`**: **Passed with exit code 0** (PostgreSQL 18.7 connected on Neon; pooler vs direct assertions verified).
- **`ruff check . --statistics`**: 728 errors total (see breakdown in §2.3).
- **`ruff format --check .`**: Failed with 36 unformatted files.
- **`mypy app`**: Failed at launch with `ImportError: DLL load failed while importing mypy: An Application Control policy has blocked this file.` due to Windows Smart App Control blocking mypyc-compiled `.pyd` binaries.
- **`pytest -v`**: **1 failed, 6 passed, 39 warnings** (Duration: 1m 45s).
  - `test_auth.py::test_health_check` PASSED
  - `test_auth.py::test_login_success` PASSED
  - `test_auth.py::test_login_invalid_password` PASSED
  - `test_auth.py::test_unauthenticated_protected_route` PASSED
  - `test_crm_finance.py::test_client_360_retrieval` **FAILED** (`AssertionError: assert 'Mehta Interiors' == 'Apex Global Technologies'` — directly proving **B-16** seed dependence).
  - `test_crm_finance.py::test_invoice_gst_calculation` PASSED
  - `test_crm_finance.py::test_lead_conversion_idempotence` PASSED

### 2.2 Frontend (`apps/web`)

- **`pnpm install`**: Succeeded (149 packages, lockfile verified).
- **`pnpm tsc --noEmit`**: **Passed with 0 errors**.
- **`pnpm lint`**: Failed (Exit code 1). Missing `.eslintrc` / `eslint.config.mjs` causing interactive configuration prompt (**F-15**).
- **`pnpm build`**: **Succeeded** (29/29 static pages generated, production build clean).

### 2.3 Ruff Errors Classification

| Rule | Count | Category | Auto-fixable? | Risk & Handling |
|---|---|---|---|---|
| `UP045` | 295 | `Optional[T]` -> `T \| None` | yes | None (safe syntax modernization for Python 3.12) |
| `B008` | 151 | Function call in default argument | no | False positive for FastAPI `Depends(...)` — ignore in `pyproject.toml` |
| `F401` | 89 | Unused import | yes | Low — verify before removal in `alembic/env.py` and `models/__init__.py` |
| `UP006` | 80 | `List` / `Dict` -> `list` / `dict` | yes | None (safe syntax modernization) |
| `I001` | 37 | Unsorted imports | yes | None |
| `UP035` | 35 | Deprecated imports (`collections.abc`) | yes | None |
| `UP017` | 21 | `datetime.timezone.utc` -> `datetime.UTC` | yes | None |
| `UP007` | 6 | `Union[X, Y]` -> `X \| Y` | yes | None |
| `BLE001` | 4 | Blind `except Exception:` | no | Review each occurrence: replace with specific exceptions or proper logging |
| `UP046` | 2 | Generic class syntax | no | Low |
| `SIM102` | 1 | Collapsible `if` statements | no | Low |
| `SIM210` | 1 | `True if ... else False` | **unsafe-fix** | Replace with `bool(...)` in `alembic/env.py` |
| `S110` | 1 | `try ... except: pass` | no | Fix during module pass |
| `RUF046` | 1 | Unnecessary cast to int | no | Low |
| `PIE790` | 1 | Unnecessary placeholder pass | yes | None |
| `RUF022` | 1 | Unsorted `__all__` | yes | None |
| `RUF059` | 1 | Unused unpacked variable | no | Low |
| `F841` | 1 | Unused variable | no | Remove assignment in `test_crm_finance.py` |
| `E712` | * | Boolean comparison `== False` | **unsafe-fix** | ⚠️ **DO NOT USE AUTOFIX**: `col == False` must be rewritten by hand to `col.is_(False)`, never `not col`! |

---

## 3. Backlog Confirmation (B-01 through B-17, F-01 through F-14)

### 3.1 Backend Backlog Confirmation

| ID | Title | Status | Confirmed Root Cause & Details |
|---|---|---|---|
| **B-01** | Leads incomplete | **Confirmed** | `leads.py` only has list, get, create, convert. Missing `PATCH /leads/{id}`, `DELETE /leads/{id}`, `POST /leads/{id}/stage`, `POST /leads/{id}/assign`, and `GET/POST /leads/{id}/activities`. Fallback mock string `"Meera Sharma"` hardcoded on line 166. Multiple non-atomic commits in `convert`. |
| **B-02** | Opportunities / Proposals missing | **Confirmed** | `Proposal` & `ProposalLineItem` models exist in `crm.py`, but `api_v1_router` has no proposals router. Opportunities UI is 100% hardcoded. |
| **B-03** | Clients gaps | **Confirmed** | `clients.py` missing `PATCH /clients/{id}` (edit), `POST /clients/{id}/archive` (soft delete), `/clients/{id}/contacts` CRUD, portal user invite, and service pause/cancel endpoint. |
| **B-04** | Services catalogue read-only | **Confirmed** | `services.py` has only a single read-only `GET /services` endpoint. No create, edit, or deactivate. |
| **B-05** | Invoices number user-typed & missing flows | **Confirmed** | `CreateInvoiceRequest` takes `invoice_number: str` from client input. No sequence generation table (`document_sequences`), no credit notes flow, no cancel/issue state machine, no overdue calculation. |
| **B-06** | Projects stage unconstrained | **Confirmed** | `PUT /{id}/stage` directly sets `project.status = payload.stage.lower().replace(" ", "_")` without state machine validation. No milestones CRUD, no deliverable upload, no project members endpoint, `Comment` model unused. |
| **B-07** | Tasks N+1 & missing standalone API | **Confirmed** | No `tasks.py` router. `/internal/tasks/page.tsx` loops over projects calling `/projects/{id}` sequentially with a silent `catch {}`. |
| **B-08** | Team / HR missing APIs | **Confirmed** | `Department` and `Employee` models exist in `hr.py` with zero API endpoints. `/internal/team` is 100% mock data. No leave balances, ledger, or timesheets endpoints. |
| **B-09** | Users management missing | **Confirmed** | No invite endpoint (`POST /users/invite`), password reset (`PasswordResetToken` unused), change password, or session list/revoke. |
| **B-10** | Reports missing API | **Confirmed** | No reports router. `/internal/reports` uses static `MONTHLY_DATA` and `SERVICE_SHARE` constants and calls `alert()` on button clicks. |
| **B-11** | Notifications, Files, Audit APIs | **Confirmed** | `Notification`, `FileAsset`, `AuditLog`, `SystemSetting` models exist in `common.py` without any API routes or S3 storage implementation. |
| **B-12** | RBAC scope unenforced | **Confirmed** | `department` scope is never enforced in any router. `invoices.py` ignores `own`/`assigned` scope for internal users. |
| **B-13** | Non-atomic audit logging | **Confirmed** | `log_audit_event()` calls `db.commit()` on its own (line 41 of `app/core/audit.py`), breaking transaction boundaries. |
| **B-14** | Auth hardening & secrets | **Confirmed** | `config.py` provides weak default secrets without Pydantic startup validation in production. No rate limiting or lockout table for login. |
| **B-15** | DB pool on serverless | **Confirmed** | `database.py` defaults to `QueuePool` without detecting serverless environments (`VERCEL=1`) or configuring `NullPool`. |
| **B-16** | Tests depend on seed state | **Confirmed** | `test_crm_finance.py` checks hardcoded seed values (`total_invoiced_rupees == 94400.0`, client name "Apex Global Technologies"). No transactional rollback fixtures or factories. |
| **B-17** | Repo hygiene | **Confirmed** | SQLite databases present on disk (`digitalfootprint_os.db` in root and `apps/api/`). |

### 3.2 Frontend Backlog Confirmation

| ID | Title | Status | Confirmed Root Cause & Details |
|---|---|---|---|
| **F-01** | `/internal/dashboard` fake data | **Confirmed** | Never calls `/dashboard/kpis`. Uses `REVENUE_TREND_DATA`, `SERVICE_REVENUE_DATA`, `ACTIVE_PROJECTS`, `INITIAL_TASKS`. |
| **F-02** | `/internal/opportunities` fake data | **Confirmed** | Driven entirely by `INITIAL_OPPORTUNITIES` array. No API integration. |
| **F-03** | `/internal/team` fake data | **Confirmed** | Driven entirely by `INITIAL_MEMBERS` array. No API integration. |
| **F-04** | `/internal/reports` fake data & alerts | **Confirmed** | Uses `MONTHLY_DATA`, `SERVICE_SHARE`, and `alert()` for export actions. |
| **F-05** | `/internal/services` fake data | **Confirmed** | Contains zero `fetch` or `api` calls. Completely hardcoded. |
| **F-06** | `DEFAULT_*` fallbacks in core pages | **Confirmed** | `DEFAULT_ACCOUNTS` in clients, `DEFAULT_INVOICES` in invoices, `DEFAULT_PROJECTS` in projects. |
| **F-07** | `/portal` fake data & hardcoded IDs | **Confirmed** | Uses `SERVICES_PROGRESS`, `INVOICES`, and hardcoded deliverable ID `"deliv-peak-homepage"`. |
| **F-08** | `/portal/agreements` & `/portal/approvals` | **Confirmed** | Uses `INITIAL_PORTAL_AGREEMENTS` and `INITIAL_DELIVERABLES`. |
| **F-09** | Duplicate layout shells | **Confirmed** | `sidebar.tsx`, `header.tsx`, `sf-header.tsx` are unreferenced duplicates; only `SaasSidebar` and `SaasHeader` are imported in `internal/layout.tsx`. |
| **F-10** | Auth routing & logout redirect | **Confirmed** | `logout()` in `auth-context.tsx` hardcoded to `router.push("/login")`, stranding portal users on internal/generic login. |
| **F-11** | `alert()` used for UX feedback | **Confirmed** | 9 occurrences found across `reports`, `settings/roles`, `support`, `portal/support`, `attendance`, `clients/new`. |
| **F-12** | Permissions not checked in UI | **Confirmed** | `saas-sidebar.tsx` contains 0 checks for `hasPermission` or permission codes. |
| **F-13** | `/internal/contracts` client redirect | **Confirmed** | Uses `useEffect` + `router.replace` causing client-side flash instead of server `redirect()`. |
| **F-14** | Responsiveness & a11y gaps | **Confirmed** | Sidebar fixed at 260px without mobile drawer. Slate `#94A3B8` text contrast issues. |

---

## 4. Newly Discovered Findings (B-18+ and F-15+)

| ID | Title | Severity | Description & Root Cause |
|---|---|---|---|
| **B-18** | Windows Smart App Control blocks unsigned `.pyd` | P1 | On Windows 11 with Smart App Control enforced, compiled C-extensions in user directories (`argon2-cffi-bindings`, `psycopg-binary`, `mypy`) fail to load with `ImportError: DLL load failed: An Application Control policy has blocked this file.` |
| **B-19** | Test runner deprecations & unused vars | P3 | `test_auth.py` and `test_crm_finance.py` use deprecated Starlette TestClient with httpx and have unused imports/assignments. |
| **B-20** | Hardcoded mock name in API response | P2 | In `apps/api/app/api/v1/leads.py:166`, `assigned_to_name` falls back to hardcoded string `"Meera Sharma"`. |
| **B-21** | Missing contract columns in schema | P1 | `contracts` table was missing `signed_copy_received` and `sent_date` from initial migration, resolved via `330814f38817_add_missing_contract_columns.py`. |
| **F-15** | Missing ESLint configuration | P2 | `apps/web` has no `.eslintrc` or `eslint.config.mjs`, causing `pnpm lint` to prompt interactively and exit with code 1. |
| **F-16** | Uncataloged `alert()` calls | P2 | Additional `alert()` calls discovered in `attendance/page.tsx:247` and `clients/new/page.tsx:64`. |
