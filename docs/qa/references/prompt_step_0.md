<USER_REQUEST>
# Digital Footprint OS (DCRM): Completion + Full QA Loop Implementation Prompt

> **Paste this whole file into Antigravity or Claude Code, opened at `C:\coding\digital foot crm\DCRM`.**
> Work through it phase by phase. Do not skip any gate.

---

## 0. Your Role

You are a **Senior Backend Engineer (FastAPI / SQLAlchemy / PostgreSQL)** and a **Senior UI/UX Engineer (Next.js 15 / React 19 / Tailwind)** working as one person. Your job has three parts:

1. **Finish** a half-built internal CRM called **Digital Footprint OS** (an agency CRM with project management, HRMS, finance, and a client portal) so that every module works end to end against the real database.
2. **Prove** that everything works by running a strict, repeatable **QA loop** over every module, every role, and every screen until the bug list is empty.
3. **Explain** what you do in plain language. The person who maintains this after you is an **undergraduate developer**, so every phase ends with a short "What changed and why" note written for them. Don't assume they know the jargon. Each time you use a new concept (RBAC scope, idempotency, paise, state machine, soft delete), explain it in one sentence the first time.

You are **resuming** someone else's work, not starting over. Respect the existing architecture, naming, and design system. Extend them and fix them. Don't rewrite them.

---

## 1. Non-Negotiable Ground Rules

| # | Rule | Why it matters |
|---|------|----------------|
| R1 | **Root cause first.** Before you fix any bug, write down (a) the symptom, (b) the exact file and line causing it, and (c) why that line is wrong. Then fix it. A fix without a stated root cause doesn't count. | Patching symptoms brings the same bug back in another module. |
| R2 | **No fake data in the UI.** Delete every `DEFAULT_*`, `INITIAL_*`, `MONTHLY_DATA`, `SERVICE_SHARE`, `REVENUE_TREND_DATA`, `ACTIVE_PROJECTS`, `INITIAL_TASKS`, `SERVICES_PROGRESS`, `INVOICES` constant and any hardcoded ID like `deliv-peak-homepage`. Every screen reads from the API. When there's no data, show a designed **empty state**, not sample rows. | Fallback sample data hides broken APIs. Right now a failing endpoint *looks* like it works. |
| R3 | **No `alert()`, `console.log`, or silent `catch {}`** in shipped code. Use one toast system plus inline form errors. | Users need clear feedback, and silent catches hide bugs. |
| R4 | **The server is the source of truth for security.** Hiding a button in the UI is cosmetic. Every endpoint must enforce permission **and** record scope on the backend. | Anyone can call the API directly with curl. |
| R5 | **Money is integer paise in the DB, always.** Convert to rupees only at the API boundary (2 decimals). Never store floats for money. | Floats cause ₹0.01 rounding drift in GST totals. |
| R6 | **Every write is atomic.** The business change and its audit log entry commit in the **same transaction**. | Today `log_audit_event()` calls `db.commit()` on its own, so a crash can leave an audit row for a change that never happened, or the reverse. |
| R7 | **Schema changes only through Alembic migrations.** Never use `Base.metadata.create_all` in app code. Never edit an already-applied migration. | Neon production must match local exactly. |
| R8 | **Small commits, one concern each**, with conventional messages (`feat(leads): …`, `fix(rbac): …`, `test(invoices): …`). | It makes rollback and review possible. |
| R9 | **Stop and ask** before deleting a model, a table, or a route that has data or callers. Everything else in this document is pre-approved. | Data loss can't be undone. |
| R10 | **Gate discipline.** Each phase ends with a **GATE** checklist. Don't start the next phase until every box is ticked and the evidence (command output, screenshots, or test results) is pasted into `docs/qa/PROGRESS.md`. | Building on unverified work multiplies bugs. |

---

## 2. What Already Exists (verified from the codebase)

Read this first so you don't rebuild what works.

### 2.1 Architecture
```
DCRM/
├── api/index.py                 ← Vercel Python entrypoint, imports apps/api/app.main:app
├── vercel.json                  ← rewrites /api/v1/* → api/index.py (single origin)
├── apps/api/                    ← FastAPI 0.115, SQLAlchemy 2, Alembic, Argon2id, fpdf2
│   ├── app/main.py              ← app factory, uniform error envelope {success,data,error}
│   ├── app/core/                ← config.py, database.py, security.py, audit.py
│   ├── app/policies/rbac.py     ← require_permission() → AccessScope{scope: all|department|assigned|own|client}
│   ├── app/db/models/           ← auth, crm, finance, projects, hr, support, common
│   ├── app/api/v1/              ← 11 routers (see 2.2)
│   ├── alembic/versions/        ← f30c91f1e3a3_initial_schema.py
│   ├── seed.py, seed_pdf_data.py
│   └── tests/                   ← test_auth.py, test_crm_finance.py (run against the seeded DB, not isolated)
└── apps/web/                    ← Next.js 15 App Router, TanStack Query, RHF + Zod, Recharts, Lucide
    ├── lib/api.ts               ← fetch wrapper, unwraps {success,data}, throws ApiError
    ├── lib/auth-context.tsx     ← /auth/me, login, logout, hasPermission()
    ├── lib/tokens.ts            ← design tokens (primary #5B4BDB, navy #0F172A, bg #F8F9FB, radius 16/12)
    ├── app/internal/*           ← 16 internal modules
    └── app/portal/*             ← client portal (home, projects, approvals, invoices, agreements, support)
```

### 2.2 Backend endpoints that exist today
| Router | Endpoints |
|---|---|
| auth | `POST /login`, `POST /logout`, `GET /me` |
| dashboard | `GET /dashboard/kpis` (**exists but the dashboard page never calls it**) |
| roles | list, matrix/modules, create, update, delete, assign, `PUT /users/{id}/status` |
| clients | list, 360 detail, create, add service, quick-create, bulk-upload |
| leads | list, detail, create, convert |
| projects | list, workspace detail, create, add task, task status, stage, deliverable review |
| invoices | list, detail, create, record payment, PDF |
| services | list (read-only) |
| support | tickets list, detail, create, comment |
| attendance | today-status, punch, summary, records, record detail, admin-correct, correction request, leave request, leave review |
| agreements | list, detail, generate, sign, send |

### 2.3 Seeded roles and permissions
Roles: `super_admin, admin, sales, project_manager, employee, hr, finance, support_agent` plus portal roles `client_owner, client_manager, client_employee, client_finance`.
Permission codes follow `module.action` (for example `leads.read`, `invoices.issue`, `settings.manage`). The scope comes from `ROLE_MATRIX` in `seed.py`.

---

## 3. Audit Findings (the gaps you must close)

Treat this as the starting backlog. **Phase 0 asks you to confirm each one and to find anything missing from this list.**

### 3.1 Backend gaps
| ID | Area | Finding |
|---|---|---|
| B-01 | Leads | No update, delete, stage-change, assign-owner, or activity (call/meeting/note/follow-up) endpoints, even though `LeadActivity` exists. |
| B-02 | Opportunities / Proposals | The `Proposal` and `ProposalLineItem` models exist, but **there is no API at all**. The opportunities UI is 100% hardcoded. |
| B-03 | Clients | No edit, archive (soft-delete), contacts CRUD, or portal-user invite endpoints. |
| B-04 | Services | Catalogue is read-only. No create, update, or deactivate. |
| B-05 | Invoices | `invoice_number` is **typed by the user**. It must be server-generated, sequential per Indian financial year (for example `DF/2026-27/0001`). There's no cancel → credit note flow (`CreditNote` model unused), no edit-while-draft, no issue/send transition, no overdue job, and no payments list. |
| B-06 | Projects | Stage update accepts **any string** (`payload.stage.lower()`), with no state machine. There's no milestone or deliverable create/update/upload, no project members, and no comments API (`Comment` model unused). |
| B-07 | Tasks | Tasks are only reachable *through* a project. `/internal/tasks` loops over 20 projects and fetches each one (an N+1 pattern). It needs a real `GET /tasks` with filters (assignee, status, due, project). |
| B-08 | Team / HR | `Department` and `Employee` exist but have **no API**. The team page is hardcoded. No leave balance list, leave ledger view, or timesheets API. |
| B-09 | Users | No user create/invite, password reset (`PasswordResetToken` unused), change password, or session list/revoke. |
| B-10 | Reports | No reports API. The page uses constants, and its export buttons call `alert()`. |
| B-11 | Notifications / Files / Audit | `Notification`, `FileAsset`, `AuditLog`, and `SystemSetting` have no read APIs. There's no upload endpoint and no S3/local storage service, although config exists for it. |
| B-12 | RBAC scope | `department` scope is **never enforced** anywhere. `assigned` and `own` are enforced in only a few routers (leads uses `own` only, and invoices/support ignore `assigned`/`own` for internal users). |
| B-13 | Audit atomicity | `log_audit_event()` commits by itself (see R6). |
| B-14 | Auth hardening | No login rate limiting or lockout. The default `SECRET_KEY` and `SUPER_ADMIN_PASSWORD` would silently work in production. |
| B-15 | DB on serverless | `QueuePool(pool_size=5)` inside Vercel functions exhausts Neon connections. It needs `NullPool` plus the Neon **pooled** URL at runtime and the direct URL for Alembic. |
| B-16 | Tests | Tests hit the dev DB and depend on seed state (`total_invoiced_rupees == 94400.0`). There's no isolated test DB, no factories, no RBAC matrix tests, and no frontend tests at all. |
| B-17 | Repo hygiene | An empty `digitalfootprint_os.db` sits at the repo root and a 1 MB SQLite file sits in `apps/api`. `.next/` and `.venv/` exist locally, so confirm they aren't tracked. |

### 3.2 Frontend gaps
| ID | Screen | Finding |
|---|---|---|
| F-01 | `/internal/dashboard` | All charts and tables come from constants. It never calls `/dashboard/kpis`. |
| F-02 | `/internal/opportunities` (+ `[id]`) | `INITIAL_OPPORTUNITIES`, so it's fully fake. |
| F-03 | `/internal/team` | `INITIAL_MEMBERS`, so it's fully fake. |
| F-04 | `/internal/reports` | Constants plus `alert()` exports. |
| F-05 | `/internal/services` | No API call at all. |
| F-06 | `/internal/leads`, `clients`, `projects`, `invoices`, `agreements`, `projects/[id]` | `DEFAULT_*` fallbacks shown when the API fails or returns empty. |
| F-07 | `/portal` home | `SERVICES_PROGRESS`, `INVOICES`, and a hardcoded deliverable id `deliv-peak-homepage`. |
| F-08 | `/portal/agreements`, `/portal/approvals` | `INITIAL_*` seed arrays. |
| F-09 | Navigation | **Duplicate shells**: `sidebar.tsx`, `saas-sidebar.tsx`, `header.tsx`, `saas-header.tsx`, and `sf-header.tsx`. Only `Saas*` is used by `internal/layout.tsx`. |
| F-10 | Auth routes | Three login pages (`/login`, `/internal/login`, `/portal/login`). `logout()` always sends users to `/login`, so portal users land on the wrong screen. |
| F-11 | UX feedback | `alert()` in attendance, roles, clients/new, portal/support, and support. No toast system. |
| F-12 | Permissions in UI | The sidebar and action buttons don't consistently check `hasPermission()`, so users see buttons that return 403. |
| F-13 | `/internal/contracts` | Redirect-only page. Keep it as a redirect, but make it a server redirect (`redirect()` in a server component) instead of a client flash. |
| F-14 | Responsiveness / a11y | Not verified. The sidebar is a fixed 260 px, and there's no mobile drawer. |

---

## 4. Phase 0: Setup, Baseline, and Audit Confirmation

**Goal:** get the app running locally, prove what works today, and confirm the backlog. **Don't change feature code in this phase.**

### Steps
1. Create `docs/qa/` with three files: `AUDIT.md`, `BUGS.md`, and `PROGRESS.md` (formats in §9).
2. Backend:
   ```bash
   cd apps/api
   uv venv --python 3.12 && .\.venv\Scripts\activate
   uv pip install -e ".[dev]"
   ```
3. Database: create a **Neon** project with two branches, `dev` and `test`. Put the URLs in `apps/api/.env`:
   - `DATABASE_URL` = Neon **pooled** URL (host contains `-pooler`), `postgresql+psycopg://…?sslmode=require`
   - `DATABASE_DIRECT_URL` = Neon **direct** URL (used only by Alembic)
   - `TEST_DATABASE_URL` = the `test` branch URL
   - Set `SQLITE_FALLBACK=false`. SQLite is no longer supported for dev, because Postgres and SQLite differ on enums, `ILIKE`, and JSON, and those differences hide bugs.
4. Run `alembic upgrade head`, then `python seed.py`, then `uvicorn app.main:app --reload --port 8000`. Open `http://127.0.0.1:8000/docs` and confirm every router appears.
5. Frontend: `cd apps/web && pnpm install && pnpm dev`. Log in as the seeded super admin.
6. **Baseline sweep.** Visit every route in §8.1. For each one, record in `AUDIT.md`: whether it loads, whether it uses real or hardcoded data, the console errors, the failed network calls, and a screenshot.
7. Run `pytest -v`, `ruff check .`, `mypy app`, `pnpm lint`, `pnpm tsc --noEmit`, and `pnpm build`. Paste the raw results into `AUDIT.md`.
8. Go through B-01…B-17 and F-01…F-14. Mark each one **Confirmed / Not reproducible / Partially**, and add any **new** findings as B-18+ or F-15+.

### GATE 0
- [ ] App runs locally against Neon `dev`, and the seed succeeds
- [ ] `AUDIT.md` covers every route, every command output, and every backlog item
- [ ] New findings are added with IDs
- [ ] "What changed and why" note for the undergraduate developer (here: what each tool does and what each folder is for)

---

## 5. Phase 1: Foundations (fix the floor before building rooms)

Each item below lists **Root cause → Fix → Acceptance criteria**.

### 1.1 Config safety (B-14)
- **Root cause:** `config.py` ships real-looking defaults for `SECRET_KEY` and `SUPER_ADMIN_PASSWORD`.
- **Fix:** add a Pydantic `model_validator`. When `APP_ENV=production`, raise at startup if `SECRET_KEY` is shorter than 64 characters or equals the default, if `SECURE_COOKIES` is false, or if `DATABASE_URL` starts with `sqlite`. Remove the plaintext admin password from `README.md` and replace it with "set via `SUPER_ADMIN_PASSWORD` env".
- **AC:** booting with `APP_ENV=production` and the defaults fails with a clear message, and booting with valid values succeeds.

### 1.2 DB engine for serverless (B-15)
- **Fix:** in `database.py`, use `poolclass=NullPool` when `settings.is_serverless` (an env flag `VERCEL=1`). Locally, keep a small `QueuePool`. In `alembic/env.py`, always use `DATABASE_DIRECT_URL`.
- **AC:** 50 concurrent requests against a deployed preview produce no "too many connections" errors.

### 1.3 Atomic audit (B-13)
- **Fix:** `log_audit_event()` must only `db.add()`. The calling endpoint does a single `db.commit()`. Add a `with transactional(db):` helper (commit on success, rollback on exception) and use it in every write endpoint.
- **AC:** a test that raises an exception after the business change leaves **neither** the change **nor** the audit row in the DB.

### 1.4 One scope engine (B-12)
Create `app/policies/scoping.py` with one function per resource that turns an `AccessScope` into a SQLAlchemy filter:
```python
def apply_scope(query, model, scope: AccessScope, *, owner_col=None, assignee_rel=None, dept_col=None, client_col=None):
    # all        → no filter
    # department → model.dept_col == user's employee.department_id
    # assigned   → user is owner OR in the assignee/member relation
    # own        → owner_col == user.id
    # client     → client_col == scope.client_id  (portal users ALWAYS get this, regardless of role scope)
```
- Use it in **every** list endpoint, and use a matching `assert_can_access(obj, scope)` in **every** detail, update, and delete endpoint.
- Portal users must **always** be restricted to their own `client_id`, even if a role is misconfigured with `all`.
- **AC:** the RBAC matrix test (§8.3) passes for every role × module × action.

### 1.5 API conventions (apply everywhere from now on)
- List endpoints accept `page`, `page_size` (max 100), `q` (search), `sort` (`field` or `-field`), and module filters, and return `{items, total, page, page_size}`.
- Use `PATCH` for partial updates and `PUT` only for full replacement.
- Delete is a **soft delete** (`is_deleted=True`, `deleted_at`, `deleted_by`). Every query must filter `is_deleted == False`. (Soft delete means the row is hidden, not erased, so it can be restored and audited.)
- Status changes go through explicit transition endpoints (`POST /invoices/{id}/issue`), never through a free-text status field.
- Validation errors return 422 with field-level details. Business-rule violations return 409 with a human-readable message.
- Every write takes an optional `Idempotency-Key` header for create/convert/payment endpoints, stored with a unique constraint. (Idempotency means sending the same request twice doesn't create two records, which protects against double-clicks.)

### 1.6 Login hardening (B-14)
- Rate-limit `POST /auth/login` to 5 attempts per 15 minutes per email + IP. Use a DB table so it works on serverless without Redis.
- Return a generic "Invalid email or password" message for both unknown users and wrong passwords.
- Rotate the session token on login and set the cookie to `HttpOnly; SameSite=Lax; Secure` in production.

### 1.7 Frontend foundations
- **One shell:** delete `sidebar.tsx`, `header.tsx`, and `sf-header.tsx` once `grep` proves they have zero imports (F-09). Keep `SaasSidebar` and `SaasHeader`.
- **Nav driven by permissions:** each `NAV_ITEMS` entry gets `permission: "leads.read"`, and items the user lacks are hidden (F-12).
- **`<Can permission="invoices.issue">`** wrapper component for action buttons.
- **Toast system:** a small `ToastProvider` (success/error/info, auto-dismiss after 4 s, ARIA `role="status"`). Replace every `alert()` (F-11).
- **Shared states:** `<PageSkeleton/>`, `<EmptyState icon title body action/>`, and `<ErrorState onRetry/>`. Every `useQuery` page renders one of loading, error, empty, or data. No fourth state.
- **Query keys:** centralise them in `lib/query-keys.ts` and invalidate the right keys after every mutation.
- **Typed API:** generate TypeScript types from FastAPI's `/openapi.json` with `openapi-typescript` into `lib/api-types.ts`. Replace `api.get<any>` everywhere.
- **Auth routing (F-10):** keep `/internal/login` and `/portal/login`, and make `/login` a chooser page. `logout()` sends users to `/portal/login` if `user_type === "client"` and to `/internal/login` otherwise. Add `middleware.ts` that redirects unauthenticated requests based on whether the `df_session` cookie exists. That's only a UX layer, because the server still enforces auth.
- **Remove all fake data (R2, F-01…F-08)** module by module as you complete them in Phase 2.

### GATE 1
- [ ] 1.1–1.7 done, each with a test or screenshot as evidence
- [ ] `grep -rn "alert(" apps/web/app apps/web/components` returns nothing
- [ ] `pytest`, `ruff`, `mypy`, `tsc`, `lint`, and `build` all pass
- [ ] "What changed and why" note (explain RBAC scope, transactions, soft delete, idempotency, and the page states)

---

## 6. Phase 2: Module Completion

For **each** module below: build the backend (models/migration → schemas → endpoints with scope → tests), then the frontend (list → detail → create/edit forms → actions), then run the **module QA loop** from §8.2 before you move on. Build in the listed order, because later modules depend on earlier ones.

For every form, apply: Zod schema mirroring the Pydantic schema, inline errors under fields, submit button disabled while pending, `Esc` closes modals, unsaved-changes guard on navigation, and focus moving to the first invalid field.

### M1. Users, Auth, and Settings
**Backend**
- `GET/POST /users`, `GET/PATCH /users/{id}`, `POST /users/{id}/deactivate|reactivate`
- `POST /users/invite` → creates the user with `must_set_password`, emails a one-time link (console provider in dev)
- `POST /auth/forgot-password`, `POST /auth/reset-password` (token hashed, 30-minute expiry, single use)
- `POST /auth/change-password` (requires the current password and revokes other sessions)
- `GET /auth/sessions`, `DELETE /auth/sessions/{id}`
- `GET/PATCH /settings` (org name, GSTIN, address, invoice prefix, financial-year start, working hours, late-mark threshold, weekly offs, holidays)
- `GET /audit-logs` (super_admin/admin only; filters: user, resource, action, date)

**Frontend:** `/internal/settings` with tabs Organisation · Users · Roles (existing page) · Holidays · Audit Log · My Account. A user table with invite, role assign, and deactivate. My Account covers profile, change password, and active sessions.

**AC:** an invited user sets a password and logs in. A deactivated user's existing session gets 403 on the next request. A reset token works once and then fails. Audit log rows appear for every write in M1–M12.

### M2. Services Catalogue
**Backend:** `POST /services`, `PATCH /services/{id}`, `POST /services/{id}/deactivate`. `code` must be unique. Pricing types are `one_time | monthly | yearly | custom`. Default HSN/SAC is `998314`. The list includes inactive services when `?include_inactive=true` (admin only).
**Frontend:** wire `/internal/services` to the API. Add a category filter, a create/edit drawer, and an active toggle. Seed services shown must match Digital Footprint's real offerings: Website, Instagram Page, YouTube Channel, WhatsApp Marketing, SEO, Calling, LinkedIn Page, Testimonials/Reviews, Status Videos, Podcast, Reels. Packages: **Basic ₹30,000, Gold ₹50,000, Platinum ₹1,00,000, Customisable** (store package inclusions as editable line items. They aren't defined yet, so leave them editable).
**AC:** a deactivated service disappears from proposal and invoice pickers but still shows on historical documents.

### M3. Leads
**Backend**
- `PATCH /leads/{id}`, `DELETE /leads/{id}` (soft), `POST /leads/{id}/assign`
- `POST /leads/{id}/stage` with a **state machine**:
  ```
  new → contacted → qualified → proposal_sent → negotiation → won | lost
  any (except won/lost) → on_hold → (back to previous stage)
  lost → requires lost_reason; won → only via proposal accepted OR explicit convert
  ```
- `GET/POST /leads/{id}/activities` (call, meeting, email, note, follow_up with `due_at`)
- `GET /leads/follow-ups?due=today|overdue|week`, scoped
- Duplicate detection on create (same phone **or** email **or** company+city) returns 409 with a link to the existing lead, and `?force=true` overrides it for admins
- `POST /leads/import` (CSV, preview step, row-level error report)
- The existing `POST /leads/{id}/convert` must be idempotent (the same lead converted twice gives the same client) and must create the client, primary contact, and opportunity link

**Frontend:** a list with saved filters (My leads, Overdue follow-ups, by stage, by source), a Kanban/table toggle, drag between stages calling the stage endpoint (optimistic UI with rollback on 409), and a detail page with an activity timeline, a log-activity composer, a follow-up scheduler, and a convert button (`<Can permission="leads.convert">`).
**AC:** a `sales` user sees only their own leads (scope `own`). An illegal stage jump (`new → won`) returns 409 and the card snaps back. Converting twice doesn't duplicate the client.

### M4. Opportunities and Proposals (B-02, F-02)
**Backend:** new router `proposals.py`.
- CRUD with line items (service, description, qty, unit price paise, discount, tax %)
- Server-computed totals (subtotal, discount, CGST/SGST or IGST by place of supply, grand total)
- Status machine: `draft → sent → viewed → accepted | rejected | expired`. Only `draft` is editable, so editing a sent proposal creates **version N+1**.
- `POST /proposals/{id}/send` (email + portal visibility), `GET /proposals/{id}/pdf` (fpdf2, same branding as invoices)
- On `accepted`: the linked lead → `won`, and you get a prompt to generate the agreement (M6) and the project (M7)

**Frontend:** replace `INITIAL_OPPORTUNITIES`. A pipeline board shows the value per stage and the weighted forecast (stage probability × value, with probabilities configurable in settings). The detail page has a line-item editor, live totals, a PDF preview, and a version history.
**AC:** totals match a hand-calculated GST example in a unit test to the paise. Accepting a proposal moves the lead to `won` in the same transaction.

### M5. Clients (Client 360)
**Backend:** `PATCH /clients/{id}`, `POST /clients/{id}/archive`, contacts CRUD `/clients/{id}/contacts`, `POST /clients/{id}/contacts/{cid}/portal-invite` (creates a client-type user with a portal role), and `PATCH /clients/{id}/services/{sid}` (pause/complete/cancel). Validate GSTIN with the 15-character regex and checksum, and derive the state code from it for place of supply.
**Frontend:** the 360 page gets tabs Overview · Contacts · Services · Projects · Proposals · Agreements · Invoices · Payments · Tickets · Files · Activity. All are live, and each tab has its own empty state.
**AC:** the 360 metrics (total invoiced, paid, outstanding, active services) equal the sums of the underlying records (tested). A portal invite gives a login that sees only this client.

### M6. Agreements / Contracts
**Backend:** the existing endpoints, plus a status machine `draft → sent → signed → active → expired`, `PATCH` while in draft, `POST /{id}/upload-signed` (FileAsset), a renewal reminder at 30 and 7 days before `end_date` (notification), and `POST /{id}/terminate` with a reason.
**Frontend:** remove `DEFAULT_AGREEMENTS` and `INITIAL_PORTAL_AGREEMENTS`. Portal signing records the signer name, IP, and timestamp, and shows a confirmation.
**AC:** a portal user can sign only their own client's agreement (a cross-client attempt returns 403, tested). A signed agreement is read-only.

### M7. Projects, Milestones, Deliverables, Comments
**Backend**
- Project stage machine:
  ```
  not_started → planning → in_progress → internal_review → client_review → (revision → in_progress) | completed
  any active → on_hold → previous ; any → cancelled (reason required, admin/PM only)
  ```
  Replace the free-text `PUT /{id}/stage` with `POST /{id}/transition {to, reason?}`.
- Members: `GET/POST/DELETE /projects/{id}/members` (role: lead, member, viewer). `assigned` scope = member.
- Milestones CRUD, with progress = completed tasks / total tasks, weighted by milestone.
- Deliverables: create with file upload (M12), `submit_for_review`, client `approve | request_revision` with a mandatory comment on revision, and versioning (v1, v2…).
- Comments: polymorphic on project, task, or deliverable, with an `internal_only` flag that is **never** returned to portal users.

**Frontend:** remove `DEFAULT_PROJECT`/`DEFAULT_TASKS`. The workspace has a stage chevron bar (only legal next stages are clickable), a milestones timeline, a task board, a deliverables panel with version history, a members tab, and a comments thread with an internal/external toggle.
**AC:** an `employee` sees only projects they're a member of. A portal user never receives an `internal_only` comment (checked in the API response, not just the UI).

### M8. Tasks (B-07)
**Backend:** new router `tasks.py`. `GET /tasks?assignee=me|{id}&status=&project=&due=today|overdue|week&priority=`, `POST /tasks` (project optional, so internal tasks work), `PATCH /tasks/{id}`, multi-assignee, `POST /tasks/{id}/status` with machine `todo → in_progress → in_review → completed`, `blocked` from anywhere with a reason, and checklist items. One query, with no N+1.
**Frontend:** rewrite `/internal/tasks` to call `GET /tasks` once. Views are My Tasks / Team / Overdue, list ↔ board. Add quick-add with `Enter` and a due-date picker in IST.
**AC:** the page makes **one** network request for the list (shown in a DevTools screenshot). The overdue count matches the dashboard.

### M9. Invoices, Payments, Credit Notes (B-05)
**Backend**
- **Server-generated invoice number**: `{prefix}/{FY}/{seq:04d}`, where FY is April–March in IST (for example `DF/2026-27/0007`). Use a `document_sequences` table with `SELECT … FOR UPDATE` so two simultaneous invoices never collide. Remove `invoice_number` from the create payload.
- Status machine: `draft → issued → partially_paid → paid`. `issued|partially_paid → overdue` (a daily job, or computed on read when `due_date < today IST` and balance > 0). `draft|issued → cancelled` (issued requires a **credit note**).
- GST: if `org.state_code == client.state_code` then CGST + SGST (half each), otherwise IGST. Round **per line**, and the invoice total = the sum of the lines. Add a unit test with at least 3 hand-checked cases, including an inter-state one and a mixed-rate one.
- `PATCH` only in `draft`. `POST /{id}/issue`, `POST /{id}/send` (email PDF + portal), `POST /{id}/cancel {reason}` → auto credit note `CN/{FY}/{seq}`.
- Payments: reject an amount ≤ 0 or one greater than the balance (409). Modes are UPI, NEFT, IMPS, cheque, cash, and card. The reference number is required except for cash. Store `received_on`. `GET /payments` list. `POST /payments/{id}/void` (admin, reason) restores the balance.
- PDF: GSTIN of both parties, place of supply, HSN/SAC, tax breakup, amount in words (Indian numbering: lakh, crore), and bank details from settings.

**Frontend:** remove `DEFAULT_INVOICES`. The invoice builder picks a client, then services, with live tax preview. Detail has the status timeline, record-payment drawer, payments table, download PDF, cancel → credit note. The portal shows issued invoices only (never drafts) and downloads its own PDF.
**AC:** two parallel create calls get consecutive numbers with no duplicates (concurrency test). Paying exactly the balance gives `paid`. Overpaying gets 409. A portal user requesting another client's PDF gets 403.

### M10. Support Tickets
**Backend:** add `PATCH /tickets/{id}` (assignee, priority, category), a status machine `open → in_progress → waiting_on_client → resolved → closed` (a client reply on `waiting_on_client` moves it back to `in_progress`, and `resolved` auto-closes after 7 days), SLA fields (`first_response_due`, `resolution_due` by priority: urgent 2h/24h, high 4h/48h, medium 8h/72h, low 24h/120h, business hours from settings), an SLA breach flag, attachments, and `internal_only` comments (same rule as M7).
**Frontend:** the internal inbox has filters (mine, unassigned, breaching, by status) and a split-view thread. Portal support has create, my tickets, reply, and attach. Replace `alert()`.
**AC:** SLA due times are computed in IST, skip weekly offs and holidays, and are unit tested. Internal notes never reach the portal response.

### M11. Team, HR, Attendance, Leave (B-08, F-03)
**Backend**
- Departments CRUD. Employees CRUD linked to `User` (code, designation, department, manager, joining date, employment type, status). `department` scope = same `department_id`.
- Attendance (existing): check IST rules against settings. Late after the threshold, half-day under X hours. No double punch-in. Punch-out requires punch-in. Corrections need approval by the manager or HR.
- Leave: `GET /leave/balances?employee=`, `GET /leave/ledger`, `GET /leave/requests`, and cancel your own pending request. Approving a leave **debits the ledger** in the same transaction, and rejecting or cancelling doesn't. Block requests that exceed the balance unless the type is `unpaid`. Exclude weekends and holidays from the day count. Half-day support.
- Timesheets: `POST/GET /timesheets` (date, project, task, minutes, note), weekly submit → manager approve.
- `GET /attendance/export?month=` → CSV.

**Frontend:** replace `INITIAL_MEMBERS` with a live directory (search, department filter, profile drawer). Attendance gets a calendar heatmap, today's punch card, corrections queue (managers), leave apply/approve flows with balance shown beside the form, and a timesheet weekly grid.
**AC:** leave balance after approve/cancel cycles always equals the ledger sum (property test). A manager sees only their department. An employee sees only their own records.

### M12. Files, Notifications, Activity
**Backend:**
- `StorageService` with two implementations: `LocalStorage` (dev) and `S3Storage` (R2). Uploads go through `POST /files` (multipart, max 25 MB, MIME allow-list, SHA-256 stored). Downloads go through `GET /files/{id}/url`, which returns a presigned URL after a scope check. **Never** expose the bucket publicly.
- Notifications: `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`. Trigger them on assignment, mention, approval needed, invoice overdue, SLA breach, leave decision, and agreement expiring.

**Frontend:** a bell in `SaasHeader` with an unread count (poll every 60 s with TanStack `refetchInterval`), a dropdown list, and mark all read. A reusable `<FileDropzone/>`.
**AC:** a portal user can't fetch a file belonging to another client by guessing an id (403, tested).

### M13. Dashboard (F-01)
**Backend:** extend `GET /dashboard/kpis` to return, **scoped to the caller**: revenue this month vs last (paid), outstanding and overdue amounts, a 12-month revenue trend, revenue by service, the lead funnel counts per stage plus conversion %, active projects with progress, my tasks due today/overdue, tickets breaching SLA, and today's attendance summary (HR/admin). It must respond in under 500 ms on seed data (add indexes where `EXPLAIN` shows sequential scans).
**Frontend:** delete every constant in `dashboard/page.tsx`. Widgets render per permission, so a `sales` user doesn't see HR widgets. Every number is clickable and deep-links to the filtered list that produces it.
**AC:** each dashboard number equals the count/sum on its linked list page (an automated test for at least 5 widgets).

### M14. Reports (B-10, F-04)
**Backend:** `GET /reports/{key}` for the keys `sales-pipeline`, `revenue`, `receivables-ageing` (0–30/31–60/61–90/90+), `gst-summary` (month, by rate, CGST/SGST/IGST), `project-status`, `team-utilisation` (timesheet hours ÷ available hours), `attendance-monthly`, and `support-sla`. Common params are `from`, `to`, and `group_by`. `?format=csv` streams CSV. PDF is optional.
**Frontend:** a report picker, date-range presets (This month, Last month, This FY, Custom), chart plus table, and Export CSV, which really downloads. Remove `MONTHLY_DATA`, `SERVICE_SHARE`, and the `alert()`s.
**AC:** the GST summary for a month equals the sum of the tax on issued (non-cancelled) invoices dated in that month. The ageing buckets sum to total outstanding.

### M15. Client Portal (F-07, F-08)
- `/portal` home: live services progress, open approvals, latest invoices, open tickets, and the account manager contact. No constants and no hardcoded ids.
- Approvals use real deliverables in `pending_review` for this client.
- The portal role matrix: `client_owner` sees all. `client_manager` sees projects/approvals/tickets but not invoices. `client_finance` sees invoices/payments/agreements only. `client_employee` sees assigned tasks/uploads only. The portal nav hides what the role can't see, **and the API enforces it**.
- Mobile-first: every portal page works at 375 px wide.

**AC:** run the full portal isolation suite (§8.3, portal section) with two seeded clients, A and B. Every cross-client request returns 403 or 404 and never data.

### GATE 2 (repeat per module, then once overall)
- [ ] Module QA loop (§8.2) passes with zero open P0/P1 bugs for the module
- [ ] Backend tests for the module pass on the isolated test DB
- [ ] No hardcoded data left in the module (`grep` evidence)
- [ ] Screenshots of loading, empty, error, and data states plus mobile view in `docs/qa/screens/<module>/`
- [ ] "What changed and why" note for the module

---

## 7. Phase 3: Design and UX Polish (Senior UI/UX pass)

Keep the existing design language from `lib/tokens.ts` (indigo `#5B4BDB`, navy `#0F172A`, canvas `#F8F9FB`, white cards with 16 px radius, 12 px inputs/buttons, Inter, Lucide icons). The goal is consistency, not a redesign.

- **Consistency audit:** one page-header pattern (title, subtitle, primary action on the right, secondary actions in a menu), one table component (sticky header, sortable columns, row hover, whole-row click as already started, a selection checkbox where bulk actions exist, pagination footer), one badge palette mapped to status (`lavender`=new/draft, `blue`=in progress/sent, `amber`=pending/review/on hold, `mint`=done/paid/won, `rose`=overdue/lost/breach, `slate`=archived/cancelled). Write the mapping once in `lib/status.ts`.
- **Number formatting:** `₹1,23,456.00` (Indian grouping via `Intl.NumberFormat('en-IN')`). Dates show as `14 Nov 2026`, times in IST with the "IST" label, and relative time for activity.
- **Responsive:** sidebar collapses to icons at < 1280 px and becomes a drawer at < 768 px. Tables become stacked cards below 640 px. Test at 375, 768, 1280, and 1600.
- **Accessibility (WCAG 2.1 AA):** all interactive elements reachable by keyboard with a visible focus ring. Modals trap focus and restore it on close. Icon-only buttons have `aria-label`. Contrast is at least 4.5:1 (check the slate `#94A3B8` text on white, which **fails** for body text, so use `#64748B` minimum). Form errors are linked with `aria-describedby`.
- **Performance:** route-level `loading.tsx`, dynamic import for Recharts, list pages under 200 KB JS, LCP under 2.5 s on preview.
- **Microcopy:** buttons are verbs ("Record payment", not "Submit"). Empty states say what this is and give one action. Destructive actions confirm with the record name and say whether they can be undone.

### GATE 3
- [ ] Lighthouse (desktop) ≥ 90 Performance, ≥ 95 Accessibility, ≥ 95 Best Practices on dashboard, leads, invoice detail, and portal home
- [ ] axe DevTools: 0 serious/critical violations on every route
- [ ] Before/after screenshots for every module

---

## 8. Phase 4: The QA Loop (how "everything gets checked properly")

### 8.1 Route inventory (every one must be in the loop)
Internal: `/internal/login`, `/internal/dashboard`, `/internal/leads`, `/internal/leads/[id]`, `/internal/opportunities`, `/internal/opportunities/[id]`, `/internal/clients`, `/internal/clients/new`, `/internal/clients/[id]`, `/internal/services`, `/internal/agreements`, `/internal/agreements/[id]`, `/internal/contracts` (redirect), `/internal/projects`, `/internal/projects/[id]`, `/internal/tasks`, `/internal/invoices`, `/internal/invoices/[id]`, `/internal/support`, `/internal/team`, `/internal/attendance`, `/internal/reports`, `/internal/settings/*`.
Portal: `/portal/login`, `/portal`, `/portal/projects`, `/portal/approvals`, `/portal/invoices`, `/portal/agreements`, `/portal/support`.
Shared: `/`, `/login`, 404 page, 403 page, error boundary.

### 8.2 The loop (run per module, then for the whole app)
```
┌─► 1. PLAN      List every user story + edge case for the module (checklist below)
│   2. TEST      Run automated tests (unit → API → E2E) + manual pass in browser
│   3. LOG       Every failure → BUGS.md with ID, severity, repro steps, expected vs actual
│   4. DIAGNOSE  Root cause (file:line + why) BEFORE touching code   ← R1
│   5. FIX       Smallest correct change + a regression test that fails before / passes after
│   6. VERIFY    Re-run the FULL module suite (not just the one test) + smoke of all other modules
└── 7. REPEAT    until: 0 open P0/P1, all P2 either fixed or explicitly deferred with reason
```
**Severity:** P0 = data loss, security, cross-tenant leak, or wrong money. P1 = a feature is broken with no workaround. P2 = broken with a workaround, or bad UX. P3 = cosmetic.

**Per-module manual checklist (tick each one in `PROGRESS.md`):**
- [ ] Create with valid data → appears in the list, detail is correct, an audit row exists
- [ ] Create with each invalid field → the right inline error, nothing saved
- [ ] Edit → persists after a hard refresh
- [ ] Delete/archive → gone from the list, still in the DB with `is_deleted`, linked records still render
- [ ] Every status transition: legal ones succeed, illegal ones give 409 plus a toast
- [ ] Search, every filter, sort on every sortable column, pagination first/last/beyond last
- [ ] Empty state, loading skeleton, error state (stop the API to see it), and retry works
- [ ] Double-click submit → no duplicate record
- [ ] Two tabs: edit in one, refresh the other → shows the fresh data
- [ ] Permission: the action is hidden for roles without it **and** the direct API call returns 403
- [ ] Scope: a user with `own`/`assigned`/`department` sees exactly the right rows (count compared with SQL)
- [ ] Mobile 375 px usable, keyboard-only usable
- [ ] No console errors and no failed network calls during the whole pass

### 8.3 Automated test suites to create
**Backend (`apps/api/tests/`)**
- `conftest.py`: create a fresh schema on `TEST_DATABASE_URL` per session, wrap each test in a transaction that rolls back, and add **factories** (`make_user(role=…)`, `make_client()`, `make_invoice()`…). Remove the dependency on `seed.py` state (B-16).
- `test_rbac_matrix.py`: **parametrised** over every role × every endpoint × (list, read, create, update, delete, transition). The expected result comes from `ROLE_MATRIX`, so when the matrix changes, the tests change with it.
- `test_scoping.py`: for `own`, `assigned`, `department`, and `client`, create rows for users X and Y and assert the visibility of each.
- `test_portal_isolation.py`: clients A and B. For **every** endpoint a portal user can reach, swap in B's ids and expect 403/404.
- `test_state_machines.py`: every legal and illegal transition for leads, proposals, projects, tasks, invoices, tickets, agreements, and leave.
- `test_money.py`: GST intra/inter-state, mixed rates, per-line rounding, payments/overpayment, credit notes, and amount in words.
- `test_sequences.py`: concurrent invoice creation (threads), with no duplicate numbers and FY rollover on 1 April IST.
- `test_leave_ledger.py`: random approve/reject/cancel sequences, where balance == ledger sum.
- `test_audit.py`: every write endpoint produces exactly one audit row, and none on rollback.
- Target: **≥ 85 % line coverage** on `app/api` and `app/policies` (`pytest --cov`).

**Frontend (`apps/web/`)**
- Add **Vitest + Testing Library** for components: forms (validation messages), `<Can>`, status badges, and money/date formatters.
- Add **Playwright** E2E in `apps/web/e2e/` with these golden journeys (run on Chromium + mobile viewport):
  1. Lead → activity → proposal → accepted → client created → agreement generated → signed in portal → project created → task done → deliverable approved in portal → invoice issued → payment recorded → paid → dashboard numbers updated
  2. Employee punch-in → apply leave → manager approves → balance reduced → attendance shows leave
  3. Portal user files a ticket → agent replies with an internal note + public reply → the portal sees only the public reply → resolved
  4. Admin creates a role with limited permissions → assigns it to a user → that user's nav and API access match exactly
  5. Security: a portal user of client A tries client B's invoice URL, project URL, and file URL, and is blocked every time
- Every Playwright test leaves no console errors (attach a `page.on('console')` assertion).

### 8.4 CI
Add `.github/workflows/ci.yml`: on every push, run ruff, mypy, pytest (with a Postgres service container), pnpm lint, tsc, vitest, build, and Playwright against `next start` + `uvicorn`. A red CI blocks merge.

### GATE 4
- [ ] All suites green in CI, with a run link in `PROGRESS.md`
- [ ] `BUGS.md`: 0 open P0/P1, and every P2/P3 either fixed or deferred with a reason
- [ ] The full loop ran **at least twice** end to end with no new P0/P1 found in the second pass

---

## 9. Tracking File Formats

**`docs/qa/BUGS.md`**
```md
| ID | Sev | Module | Title | Repro steps | Expected | Actual | Root cause (file:line + why) | Fix commit | Regression test | Status |
|----|-----|--------|-------|-------------|----------|--------|------------------------------|------------|-----------------|--------|
| BUG-001 | P0 | invoices | Portal user can download other client's PDF | 1. login as A … | 403 | 200 + PDF | invoices.py:417 checks isolation after file read | abc123 | test_portal_isolation::test_invoice_pdf | Fixed |
```

**`docs/qa/PROGRESS.md`**: one section per phase/module containing the gate checklist, command outputs, coverage %, links to screenshots, and the **"What changed and why"** note (5–10 bullet points in plain English for the undergraduate developer).

**`docs/qa/AUDIT.md`**: the Phase 0 baseline plus backlog confirmation.

---

## 10. Phase 5: Deployment (Vercel + Neon)

1. Vercel project root = `DCRM/`. Keep `vercel.json` (Next.js + `api/index.py` Python function). Set the env vars in Vercel for **Preview** and **Production** separately. Production uses the Neon `main` branch, and Preview uses a Neon branch per PR if possible.
2. Production env: `APP_ENV=production`, `SECURE_COOKIES=true`, a strong `SECRET_KEY`, `DATABASE_URL` (pooled), `DATABASE_DIRECT_URL` (direct), `STORAGE_PROVIDER=s3` + R2 keys, and `EMAIL_PROVIDER=resend|smtp`.
3. Migrations run **before** deploy from CI with `alembic upgrade head` against `DATABASE_DIRECT_URL`, never at function cold start.
4. Seed only the org, roles, permissions, services, and one super admin in production. **No sample client data.** Split `seed.py` into `seed_core.py` (prod-safe) and `seed_demo.py` (dev only).
5. Smoke test after every deploy (scripted): `/api/v1/health`, login, list each module, create + delete a test lead, then log out.
6. Confirm that `/docs` and `/openapi.json` return 404 in production (already coded, so verify it).
7. **The usual trap is "works locally, fails on Vercel".** Before you call deploy done, verify: every fix is committed and pushed (`git status` clean), there are no `localhost` URLs in the code (`grep -rn "localhost\|127.0.0.1" apps/web apps/api/app`), the cookies work on the real domain, and the Python function's cold start is under 3 s with no import errors in Vercel logs.

### GATE 5
- [ ] Production URL is live, the smoke script passes, and the Playwright golden journeys pass against Preview
- [ ] No secrets in the repo (`git log -p | grep -i "secret\|password"` reviewed)
- [ ] The README is rewritten: setup, env table, commands, roles, the scope explanation, and how to run the QA loop

---

## 11. Definition of Done (the whole project)

The project is done only when **all** of these are true:

1. Every route in §8.1 renders real data with loading, empty, and error states, and none contains hardcoded sample data.
2. Every model in `app/db/models/` is reachable through a scoped, tested API or is explicitly documented as internal-only.
3. Every status field changes only through a validated state machine with tests.
4. Every role in `ROLE_MATRIX` and every portal role passes the automated RBAC matrix, scoping, and isolation suites.
5. Money is exact to the paise, invoice numbers are sequential per FY and collision-free, and GST is correct for intra- and inter-state supply.
6. Every write is atomic with its audit log.
7. CI is green: ruff, mypy, pytest ≥ 85 % coverage on API + policies, lint, tsc, vitest, build, and Playwright.
8. Lighthouse and axe targets from Gate 3 are met.
9. Deployed on Vercel + Neon with the smoke test passing.
10. `docs/qa/` contains a complete audit, an empty P0/P1 bug list, per-module progress with evidence, and a plain-English "What changed and why" note for every phase.

---

## 12. How to Report Back After Each Working Session

End every session with this block. Keep it short, factual, and free of claims that aren't backed by evidence:

```md
### Session report — <date>
**Phase / module:** …
**Done (with evidence):** …  (test names, commit hashes, screenshot paths)
**Bugs found / fixed:** BUG-0xx … (root cause in one line each)
**Still open:** …
**Next step:** …
**For the undergraduate developer — what changed and why:**
- …
```

Begin with **Phase 0** now. Don't change any feature code until Gate 0 is ticked.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T11:08:40+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>