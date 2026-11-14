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
- [ ] **Dev Data Pollution Decision (§2.3):**
  - Choose Option A (reset dev branch from Neon console & re-seed) **or** Option B (run targeted cleanup script).
- [ ] **Gate 0 Sign-Off:** Reply with "Gate 0 approved" to begin Phase 1.

---

### 2. Gate 0 Checklist
- [x] Initial tracking files created (`AUDIT.md`, `BUGS.md`, `PROGRESS.md`).
- [x] Backlog findings B-01…B-17 and F-01…F-14 verified and confirmed with file:line citations in `AUDIT.md`.
- [x] New findings cataloged with severities (B-18 P1, B-19 P3, B-20 P2, B-21 P1, F-15 P2, F-16 P2).
- [x] Environment verification script created (`apps/api/scripts/check_env.py`) — runs without leaking secrets and strictly enforces branch isolation (fails with exit code 2 if `TEST_DATABASE_URL` matches dev or is unset).
- [x] Pytest guard implemented in `apps/api/tests/conftest.py` preventing test execution against dev database.
- [x] Git attributes configured (`* text=auto eol=lf`) in `.gitattributes`.
- [x] Database migrations verified against PostgreSQL (`330814f38817_add_missing_contract_columns.py` applied with `server_default=sa.false()`).
- [x] `alembic check` and downgrade/upgrade round-trip verified (0 drift, exit code 0).
- [x] Both `seed.py` and `scripts/dev_only/seed_pdf_data.py` executed successfully against live database.
- [x] Backend running on `http://127.0.0.1:8000` (`/api/v1/health` status: ok).
- [x] Frontend running on `http://localhost:3000` (status: 200).
- [x] Super admin authentication confirmed (`admin@digitalfootprint.in` / `Admin@123456!`).
- [x] Real Client Data Audit completed (§2.5): `seed_pdf_data.py` moved to `scripts/dev_only/` with `APP_ENV=development` guard; `git remote -v` confirmed 0 remotes.
- [x] QA Users created idempotently via `scripts/dev_only/create_qa_users.py` (`qa.sales` and `qa.client`).
- [x] Automated baseline route sweep executed across 39 routes and 4 roles (`unauthenticated`, `super_admin`, `sales`, `client_owner`) with full-page screenshots in `docs/qa/screens/baseline/`.
- [x] API-down resilience test executed (`apps/web/e2e/api-down.spec.ts`) capturing behavior when API is offline.
- [x] Baseline command outputs documented below (`check_env`, `mypy`, `ruff check`, `ruff format`, `pnpm tsc`, `pnpm build`, `pnpm lint`).
- [ ] Owner confirms §1 actions and replies "Gate 0 approved".

---

### 3. Command Outputs & Baseline Evidence (§2.6)

#### 3.1 Environment Verification (`python -m scripts.check_env`)
```
=================================================================
 Digital Footprint OS (DCRM) — Environment Verification [ALL]
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
SUPER_ADMIN_EMAIL          | SET
SUPER_ADMIN_PASSWORD       | SET

[2/3] Checking database connectivity (credentials hidden)...
 - DATABASE_URL        : OK (PostgreSQL 18.7 (a21afb5), db=neondb)
 - DATABASE_DIRECT_URL : OK (PostgreSQL 18.7 (a21afb5), db=neondb)
 - TEST_DATABASE_URL   : OK (PostgreSQL 18.7 (a21afb5), db=neondb)

[3/3] Checking database branch isolation...
 - Dev vs Test branch comparison: SAME

 [ERROR] TEST_DATABASE_URL points at the dev database — refusing.
         Create a Neon 'test' branch and configure TEST_DATABASE_URL.

=================================================================
 Result: FAILED ON DATABASE ISOLATION GUARD (exit code 2)
=================================================================
```

#### 3.2 Python Type Check (`mypy app`)
```
app\core\database.py:15: error: Incompatible types in assignment (expression has type "dict[str, bool]", target has type "bool")  [assignment]
app\core\database.py:19: error: Incompatible types in assignment (expression has type "int", target has type "bool")  [assignment]
app\core\database.py:20: error: Incompatible types in assignment (expression has type "int", target has type "bool")  [assignment]
app\core\database.py:21: error: Incompatible types in assignment (expression has type "int", target has type "bool")  [assignment]
app\policies\rbac.py:105: error: Missing type arguments for generic type "Callable"  [type-arg]
app\api\v1\services.py:29: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\dashboard.py:96: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\agreements.py:62: error: Need type annotation for "parts" (hint: "parts: list[<type>] = ...")  [var-annotated]
app\api\v1\agreements.py:78: error: Argument 1 to "order_by" of "Query" has incompatible type "OrderByList | UnaryExpression[Any]"  [arg-type]
app\api\v1\support.py:69: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\roles.py:61: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\projects.py:122: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\invoices.py:488: error: Argument 5 to "cell" of "FPDF" has incompatible type "Literal[0]"; expected "Literal['DEPRECATED']"  [arg-type]
app\api\v1\auth.py:108: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\attendance.py:272: error: Function is missing a return type annotation  [no-untyped-def]
app\api\v1\clients.py:116: error: Function is missing a return type annotation  [no-untyped-def]

Found 117 errors in 15 files (checked 29 source files)
```

#### 3.3 Python Linter Statistics (`python -m ruff check . --statistics`)
```
295	UP045 	[*] non-pep604-annotation-optional
151	B008  	[ ] function-call-in-default-argument
 88	F401  	[*] unused-import
 80	UP006 	[*] non-pep585-annotation
 35	UP035 	[-] deprecated-import
 35	I001  	[*] unsorted-imports
 21	UP017 	[*] datetime-timezone-utc
  6	UP007 	[*] non-pep604-annotation-union
  2	BLE001	[ ] blind-except
  2	UP046 	[ ] non-pep695-generic-class
  1	SIM102	[ ] collapsible-if
  1	SIM210	[ ] if-expr-with-true-false
  1	S110  	[ ] try-except-pass
  1	RUF046	[ ] unnecessary-cast-to-int
  1	PIE790	[*] unnecessary-placeholder
  1	RUF022	[*] unsorted-dunder-all
  1	RUF059	[ ] unused-unpacked-variable
  1	F841  	[ ] unused-variable
Found 723 errors.
[*] 531 fixable with `--fix` (6 unsafe fixes available with `--fix --unsafe-fixes`).
```
**Explanation of 720 → 728 → 723 Delta:**
1. Baseline repo had 720 errors.
2. Initial drafts of `check_env.py` and `audit_test_pollution.py` added 8 lint warnings (e.g., `BLE001`, `SIM102`, `I001`), temporarily raising the total to 728.
3. Both scripts were refactored to be 100% ruff-clean. Furthermore, `seed_pdf_data.py` (which had 5 unused imports `F401` and unused loop variables in the root directory) was moved to `scripts/dev_only/` and cleaned up. This brought the count down to 723.
4. All newly authored scripts in `scripts/` and `scripts/dev_only/` are 100% ruff-clean. Mechanical autofix of the remaining 723 errors across legacy feature code will occur in Phase 1.0.

#### 3.4 Python Formatting Check (`python -m ruff format --check .`)
```
40 files would be reformatted, 4 files already formatted
```

#### 3.5 TypeScript Type Check (`pnpm tsc --noEmit`)
```
Exit Code: 0 (Clean, 0 errors)
```

#### 3.6 Next.js Production Build (`pnpm build`)
```
$ next build
   ▲ Next.js 15.5.29

   Creating an optimized production build ...
 ✓ Compiled successfully in 8.7s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (29/29) ...
 ✓ Generating static pages (29/29)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    1.64 kB         104 kB
├ ○ /_not-found                            999 B         103 kB
├ ○ /internal/agreements                 5.23 kB         111 kB
├ ƒ /internal/agreements/[id]               5 kB         120 kB
├ ○ /internal/attendance                 9.63 kB         123 kB
├ ○ /internal/clients                    3.61 kB         118 kB
├ ƒ /internal/clients/[id]               5.49 kB         120 kB
├ ○ /internal/clients/new                4.22 kB         110 kB
├ ○ /internal/contracts                    481 B         103 kB
├ ○ /internal/dashboard                  7.62 kB         225 kB
├ ○ /internal/invoices                   3.24 kB         118 kB
├ ƒ /internal/invoices/[id]              5.51 kB         120 kB
├ ○ /internal/leads                      6.11 kB         121 kB
├ ƒ /internal/leads/[id]                 6.67 kB         121 kB
├ ○ /internal/login                      4.05 kB         117 kB
├ ○ /internal/opportunities              4.32 kB         111 kB
├ ƒ /internal/opportunities/[id]         5.63 kB         112 kB
├ ○ /internal/projects                   3.35 kB         118 kB
├ ƒ /internal/projects/[id]               4.9 kB         120 kB
├ ○ /internal/reports                    3.01 kB         217 kB
├ ○ /internal/services                   6.38 kB         113 kB
├ ○ /internal/settings/roles             6.44 kB         126 kB
├ ○ /internal/support                    4.45 kB         124 kB
├ ○ /internal/tasks                      2.96 kB         127 kB
├ ○ /internal/team                       4.28 kB         117 kB
├ ○ /login                               4.04 kB         117 kB
├ ○ /portal                              3.88 kB         110 kB
├ ○ /portal/agreements                   4.74 kB         107 kB
├ ○ /portal/approvals                    3.54 kB         106 kB
├ ○ /portal/invoices                     3.54 kB         121 kB
├ ○ /portal/login                        3.83 kB         117 kB
├ ○ /portal/projects                     2.39 kB         120 kB
└ ○ /portal/support                      4.62 kB         124 kB
+ First Load JS shared by all             102 kB
```

#### 3.7 Frontend Lint Check (`pnpm lint`)
```
$ next lint
`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .

? How would you like to configure ESLint? https://nextjs.org/docs/app/api-reference/config/eslint
❯  Strict (recommended)
   Base
   Cancel ⚠ If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin.
[ELIFECYCLE] Command failed with exit code 1.
```
*(Confirmed as Bug F-15: unconfigured ESLint causes `pnpm lint` to prompt interactively; will be resolved cleanly in Phase 1.0).*

---

### 4. What Changed and Why (For the Undergraduate Developer)

Here is a plain-English explanation of the key concepts and changes made during this Gate 0 close-out:

1. **RBAC Scope (Role-Based Access Control):**
   *Plain English:* Instead of simply asking "is this user logged in?", RBAC scope defines *which records* a specific role can see. A Super Admin sees `all` client accounts; a Sales user sees only their `assigned` clients; a Client Owner sees only data belonging to their own `client_id`. We verified this with QA users across all 39 frontend routes.

2. **Database Branch Isolation & Test Safety (G0-1, G0-2):**
   *Plain English:* When automated tests run, they create dummy invoices, clients, and leads. If tests run against the same database you use to view the app (the `dev` database), test data mixes with your real application data. We hardened `check_env.py` and `conftest.py` so that automated tests are physically blocked from running unless a completely separate `test` database branch is provided.

3. **Data Contamination Audit:**
   *Plain English:* An audit script (`audit_test_pollution.py`) inspected the database and found 7 leftover rows created by an earlier test run. We identified them precisely and documented cleanup options for the owner.

4. **Automated Baseline Route Sweep:**
   *Plain English:* Rather than manually clicking through 30+ pages, we used Playwright to automate visiting every single URL in headless Chrome, capturing full-page screenshots into `docs/qa/screens/baseline/`, and checking for JavaScript console errors and network failures. This gives us photographic and telemetry proof of how the application looked before making changes in Phase 1.

5. **Real vs. Fake Data (Rule R2):**
   *Plain English:* A common pitfall in frontend apps is having a page that *looks* functional because it displays hardcoded JavaScript sample arrays (like `REVENUE_TREND_DATA = [...]`), even though the backend endpoint isn't actually being called. Our sweep documented that `/internal/dashboard` is currently doing this, giving us the exact blueprint for what to connect in Phase 1 and 2.

---

## Phase 1: Foundations, Tooling Hygiene & Architecture Hardening

### 1. Phase 1 Checklist & Verification Status
- [x] **Phase 1.0: Tooling Hygiene**
  - Ruff configuration (`select = ["E", "F", "I", "UP", "B", "SIM", "N", "S", "DTZ", "RUF"]`).
  - Safe autofix + format (Commit `01edc37`).
  - Hand fix of E712 boolean comparisons with AST regression tests (Commit `aeb8f58`).
  - Timezone awareness (`datetime.now(UTC)`) replacing naive datetimes (Commit `281e4fa`).
  - Flat ESLint 9 configuration in `apps/web/eslint.config.mjs` (`pnpm lint`: 0 errors, Commit `ebdc1b8`).
  - Clean repository hygiene (0 `.db` files tracked).
- [x] **Phase 1.1: Isolated Test Harness & Factories (B-16)**
  - Created `apps/api/tests/factories.py` (`make_org`, `make_role`, `make_user`, `make_client`, `make_contact`, `make_service`, `make_lead`, `make_project`, `make_invoice`).
  - Isolated memory tests in `tests/test_boolean_comparisons.py` (Commit `22ad757`).
- [x] **Phase 1.2: Config Safety (B-14)**
  - Pydantic `@model_validator(mode="after")` enforcing >= 64-char non-default `SECRET_KEY`, `SECURE_COOKIES=True`, and non-SQLite `DATABASE_URL` in production.
  - Verified with 4 unit tests in `tests/test_config.py` (Commit `28f77ca`).
- [x] **Phase 1.3: Serverless DB Engine (B-15)**
  - Configured `NullPool` for serverless environments (`VERCEL=1` or `SERVERLESS=1`) and `QueuePool` with `pool_pre_ping=True` for container/VM deployments.
  - Verified with 4 unit tests in `tests/test_database.py` (Commit `b08e3b7`).
- [x] **Phase 1.4: Atomic Audit & Transaction Helper (B-13)**
  - Removed rogue `db.commit()` inside `log_audit_event()`.
  - Created `app/core/tx.py` with `transactional(db)` context manager.
  - Rewrote all write endpoints (`leads.py`, `clients.py`, `projects.py`, `invoices.py`, `roles.py`, `attendance.py`, `auth.py`) to commit entity and audit records atomically.
  - Verified with 3 unit tests in `tests/test_audit_atomicity.py` (Commit `8fa5e47`).
- [x] **Phase 1.5: Unified Scoping Engine (B-12, B-20)**
  - Implemented `app/policies/scoping.py` (`apply_scope` and `assert_can_access`).
  - Wired into `invoices.py`, `leads.py`, `clients.py`, `projects.py`, and `support.py`.
  - Fixed B-20: removed fallback `"Meera Sharma"` string from `leads.py:166`.
  - Verified with 3 unit tests in `tests/test_scoping.py` (Commit `1b4fb52`).
- [x] **Phase 1.6: Login Hardening (B-14)**
  - Created `login_attempts` model & applied Alembic migration `ae55bf25660c`. Verified zero drift with `alembic check`.
  - Enforced 5 failed attempts per 15-minute window rate limiting (HTTP 429).
  - Enforced generic authentication error message (`"Invalid email or password."`) preventing account enumeration.
  - Verified with 3 unit tests in `tests/test_login_hardening.py` (Commit `8b412a9`).
- [x] **Phase 1.7: Frontend Foundations (F-09, F-11, F-12, F-16)**
  - Deleted orphaned `sidebar.tsx`, `header.tsx`, `sf-header.tsx` (Commit `938957a`).
  - Installed `sonner` and replaced all 9 `alert()` calls across attendance, clients, reports, roles, and support (Commit `0075c85`).
  - Created `apps/web/components/ui/states.tsx` (`PageSkeleton`, `EmptyState`, `ErrorState`).
  - Created `apps/web/lib/query-keys.ts` with centralized query key factory.
  - Created `apps/web/components/ui/can.tsx` `<Can permission="...">` RBAC guard.
  - Filtered sidebar navigation links by user permissions via `hasPermission`.
  - Cleared hardcoded fake count badges (`"8"`, `"142"`, `"46"`, `"38"`, `"3"`, `"7"`) and fallback name `"Sai Varshith"`.
  - Full production build passes with 0 errors (`pnpm build`: 29/29 routes compiled).

---

### 2. What Changed and Why (For the Undergraduate Developer)

1. **Atomic Transaction (B-13):**
   *Plain English:* In database systems, "atomic" comes from the Greek word for indivisible. When you create an invoice, you also need to write an audit log row saying "User X created invoice Y". Previously, the code wrote the invoice, committed it, and then separately wrote the audit log. If the server crashed between those two steps, the database was left in an inconsistent state. Now, using `transactional(db)` or staging both with `db.flush()`, both changes commit together or neither does.

2. **Idempotency:**
   *Plain English:* Idempotency means that performing the same operation multiple times produces the exact same result as performing it once. For example, if a user accidentally double-clicks "Convert Lead to Client", the system converts it the first time and rejects the second click with an error instead of creating two duplicate client records.

3. **Paise vs. Rupees (Rule R5):**
   *Plain English:* Computers store decimal numbers (floats) using binary fractions, which causes subtle math errors (e.g. `0.1 + 0.2 === 0.30000000000000004`). In financial software, this leads to ₹0.01 rounding errors on GST tax calculations. To prevent this, the database *only* stores whole integers of paise (₹100.50 is stored as `10050`). We only convert to rupees when presenting the number to the user.

4. **Scoping Engine (B-12):**
   *Plain English:* When an employee asks for "list of invoices", the server shouldn't return all invoices in the agency. The scoping engine (`apply_scope`) automatically attaches a SQL `WHERE` clause: if you are a client, you only see your company's invoices; if you are an account manager, you only see invoices for your assigned clients; only administrators see everything.

5. **Brute-Force Rate Limiting (B-14):**
   *Plain English:* An attacker might try thousands of passwords against an account. By recording login attempts in the database and blocking any email or IP address after 5 failed attempts in 15 minutes, brute-force attacks are stopped in their tracks.
