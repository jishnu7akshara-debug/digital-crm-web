# QA & Implementation Progress (PROGRESS.md)

This document tracks progress phase by phase through the Digital Footprint OS (DCRM) completion and QA loop.

---

## Phase 0: Setup, Baseline, and Audit Confirmation

### 1. Owner Actions (Prerequisites for Gate 0 Sign-Off)
These steps are managed by the owner directly. Credentials and sensitive values are maintained locally and never committed.
- [ ] **Choose backend runtime:** WSL2 (Ubuntu, recommended for production parity) **or** Windows Smart App Control configuration (owner's choice).
- [ ] **Neon Project Setup:** Create project `digital-footprint-os` with three branches:
  - `main` (production, leave empty for now)
  - `dev` (development database, for app execution and migrations)
  - `test` (test database, isolated for automated test runs)
- [ ] **Configure `apps/api/.env`:**
  - `DATABASE_URL`: `dev` branch pooled connection string (host contains `-pooler`) with `postgresql+psycopg://` or `postgresql+pg8000://` prefix
  - `DATABASE_DIRECT_URL`: `dev` branch direct connection string (no `-pooler`)
  - `TEST_DATABASE_URL`: `test` branch direct connection string (isolated from dev)
- [ ] **Verify git-ignore:** Confirm `.env` is ignored via `git check-ignore apps/api/.env`.

---

### 2. Gate 0 Checklist
- [x] Initial tracking files created (`AUDIT.md`, `BUGS.md`, `PROGRESS.md`).
- [x] Backlog findings B-01…B-17 and F-01…F-14 verified and confirmed with file:line citations in `AUDIT.md`.
- [x] New findings cataloged with severities (B-18 P1, B-19 P3, B-20 P2, B-21 P1, F-15 P2, F-16 P2).
- [x] Environment verification script created (`apps/api/scripts/check_env.py`) — runs without leaking secrets and enforces pooler vs direct assertions.
- [x] Git attributes configured (`* text=auto eol=lf`) in `.gitattributes`.
- [x] Database migrations verified against PostgreSQL (`330814f38817_add_missing_contract_columns.py` applied).
- [x] Both `seed.py` and `seed_pdf_data.py` executed successfully against live database.
- [x] Backend running on `http://127.0.0.1:8000` (`/api/v1/health` status: ok).
- [x] Frontend running on `http://localhost:3000` (status: 200).
- [x] Super admin authentication confirmed (`admin@digitalfootprint.in`).
- [x] Statistical breakdown of 728 ruff issues documented in `AUDIT.md`.
- [x] Baseline test run executed (`pytest` captured seed-dependence failure on `test_client_360_retrieval` proving B-16).
- [ ] Browser route sweep across all routes for 3 roles (`super_admin`, `sales`, `client_owner`) with screenshots and network logs.
- [ ] Owner confirms §1 actions and Gate 0 sign-off.

---

### 3. Command Outputs & Evidence

#### 3.1 Environment Check (`python -m scripts.check_env`)
```
=================================================================
 Digital Footprint OS (DCRM) — Environment Verification
=================================================================
[1/3] Checking required environment variables...
Variable                   | Status
----------------------------------------
APP_ENV                    | SET
APP_NAME                   | SET
APP_DOMAIN                 | SET
FRONTEND_URL               | SET
API_V1_PREFIX              | SET
SECRET_KEY                 | SET
SESSION_COOKIE_NAME        | SET
DATABASE_URL               | SET
DATABASE_DIRECT_URL        | SET
TEST_DATABASE_URL          | SET
SUPER_ADMIN_EMAIL          | SET
SUPER_ADMIN_PASSWORD       | SET

[2/3] Checking database connectivity (credentials hidden)...
 - DATABASE_URL        : OK (PostgreSQL 18.7 (a21afb5), db=neondb)
 - DATABASE_DIRECT_URL : OK (PostgreSQL 18.7 (a21afb5), db=neondb)
 - TEST_DATABASE_URL   : OK (PostgreSQL 18.7 (a21afb5), db=neondb)

[3/3] Checking database branch isolation...
 ⚠️  WARNING: DATABASE_DIRECT_URL and TEST_DATABASE_URL point to the SAME database.
     Ensure your Neon project has a dedicated 'test' branch.
=================================================================
 Result: ALL CHECKS PASSED (exit code 0)
=================================================================
```

#### 3.2 Baseline Pytest Execution
```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0 -- C:\coding\digital foot crm\DCRM\apps\api\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\coding\digital foot crm\DCRM\apps\api
configfile: pyproject.toml
plugins: anyio-4.16.0, asyncio-1.5.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 7 items

tests/test_auth.py::test_health_check PASSED                             [ 14%]
tests/test_auth.py::test_login_success PASSED                            [ 28%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 42%]
tests/test_auth.py::test_unauthenticated_protected_route PASSED          [ 57%]
tests/test_crm_finance.py::test_client_360_retrieval FAILED              [ 71%]
tests/test_crm_finance.py::test_invoice_gst_calculation PASSED           [ 85%]
tests/test_crm_finance.py::test_lead_conversion_idempotence PASSED       [100%]

================================== FAILURES ===================================
__________________________ test_client_360_retrieval __________________________
    def test_client_360_retrieval(auth_client):
        res = auth_client.get("/api/v1/clients")
        items = res.json()["data"]["items"]
        client_id = items[0]["id"]
        detail_res = auth_client.get(f"/api/v1/clients/{client_id}")
        detail = detail_res.json()["data"]
>       assert detail["name"] == "Apex Global Technologies"
E       AssertionError: assert 'Mehta Interiors' == 'Apex Global Technologies'
============ 1 failed, 6 passed, 39 warnings in 105.52s (0:01:45) =============
```

#### 3.3 Ruff Statistics Breakdown (`python -m ruff check . --statistics`)
```
295  UP045   [*] non-pep604-annotation-optional (Optional[T] -> T | None)
151  B008    [ ] function-call-in-default-argument (FastAPI Depends() in defaults)
 89  F401    [*] unused-import
 80  UP006   [*] non-pep585-annotation (List/Dict -> list/dict)
 37  I001    [*] unsorted-imports
 35  UP035   [-] deprecated-import
 21  UP017   [*] datetime-timezone-utc
  6  UP007   [*] non-pep604-annotation-union
  4  BLE001  [ ] blind-except
  2  UP046   [ ] non-pep695-generic-class
  1  SIM102  [ ] collapsible-if
  1  SIM210  [ ] if-expr-with-true-false
  1  S110    [ ] try-except-pass
  1  RUF046  [ ] unnecessary-cast-to-int
  1  PIE790  [*] unnecessary-placeholder
  1  RUF022  [*] unsorted-dunder-all
  1  RUF059  [ ] unused-unpacked-variable
  1  F841    [ ] unused-variable
Total: 728 errors (534 fixable with --fix, 6 with --unsafe-fixes).
```

---

### 4. For the Undergraduate Developer — What changed and why
- **Why credentials must never be in chat, git, or documentation:**
  Connection strings contain usernames and passwords. If posted in chat or committed to git, they enter version history and model logs, where anyone with access can read them and compromise the database. By using `.env` (which is git-ignored) and writing a verification script (`check_env.py`) that prints only connection health and never passwords, our credentials stay completely safe.
- **Why we differentiate pooled vs direct database URLs:**
  PostgreSQL connection poolers (like Neon's `-pooler` PgBouncer) multiplex dozens of serverless API requests onto a few backend connections. However, transaction-level pooling breaks schema migrations that run transactional DDL (`ALTER TABLE`). That's why FastAPI uses the pooled URL, while Alembic migrations must connect directly to the database.
- **Why the `test_client_360_retrieval` test failed:**
  The test was written assuming `items[0]` would always be `"Apex Global Technologies"`. As soon as additional sample records were seeded (`seed_pdf_data.py`), the first client became `"Mehta Interiors"`. This proves finding **B-16**: tests must create their own isolated test data using factories rather than relying on global database state.
- **Why naive ruff fixes are dangerous in SQLAlchemy:**
  Ruff rule `E712` suggests replacing `model.is_deleted == False` with `not model.is_deleted`. In pure Python that works, but in SQLAlchemy, `model.is_deleted` is a column expression! Python's `not` operator immediately evaluates the expression as a truthy Python object, returning a condition that matches ALL rows. In SQLAlchemy, boolean queries must always use `.is_(False)` or `.is_(True)`.

---
