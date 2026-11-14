# Digital Footprint OS (DCRM) — Specification Compliance Matrix (SPEC_COMPLIANCE.md)

> **Generated:** 2026-11-14 (Round 3 Baseline Audit)  
> **Rule R12 Enforcement:** This matrix is the single immutable source of truth for project completion.  
> **Status Definitions:**
> - **Done:** Implemented, tested, and evidenced with verbatim command output, tests, and non-skeleton screenshots per Rule R11.
> - **Partial:** Some code or schema exists, but endpoints, UI, edge cases, tests, or state machines are missing.
> - **Not started:** Zero implementation exists.

---

## 1. Master Prompt §5: Phase 1 Foundations

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|
| **F-1.1** | **Config safety (B-14):** Pydantic startup validator checking production `SECRET_KEY` (≥64 chars), `SECURE_COOKIES=true`, and forbidding `sqlite` in production. | **Done** | `apps/api/app/core/config.py:65` (`validate_production_safety`); verified in `tests/test_config.py::test_production_weak_secret_key_fails` (passed) | None. |
| **F-1.2** | **DB engine for serverless (B-15):** `poolclass=NullPool` on serverless (`VERCEL=1`), `QueuePool` locally, `DATABASE_DIRECT_URL` in `alembic/env.py`. | **Done** | `apps/api/app/core/database.py:34-45`; `apps/api/alembic/env.py:27-33`; verified in `tests/test_database.py::test_serverless_null_pool_vercel` (passed) | None. |
| **F-1.3** | **Atomic audit (B-13):** `log_audit_event()` only performs `db.add()`, calling endpoint commits; rollback aborts both audit and business change. | **Done** | `apps/api/app/core/audit.py:21-42`; verified in `tests/test_audit_atomicity.py::test_audit_log_does_not_commit_independently` (passed) | Transactional context manager helper needs consistent adoption across all future module writes. |
| **F-1.4** | **One scope engine (B-12):** `app/policies/scoping.py` turning `AccessScope` into SQLAlchemy filter (`all`, `department`, `assigned`, `own`, `client`). Client portal always isolated. | **Partial** | `apps/api/app/policies/scoping.py:15-80`; `tests/test_scoping.py` (3 passed) | Scoping applied to existing modules, but portal role matrix (`client_manager`, `client_finance`, etc.) and departmental scoping across HR/Support are incomplete. |
| **F-1.5** | **API conventions:** Standard pagination `{items, total, page, page_size}`, `PATCH` for partial updates, soft-delete filtering, explicit state machine transitions, `Idempotency-Key` on writes. | **Partial** | Pagination in `app/api/schemas.py`; `SoftDeleteMixin` in `app/db/base.py` | Idempotency-Key header support missing on create/convert endpoints; explicit transition endpoints missing on Projects, Tickets, and Agreements. |
| **F-1.6** | **Login hardening (B-14):** Rate limit 5 attempts / 15 min per email+IP via DB table, generic error message on wrong email/password, session rotation. | **Done** | `apps/api/app/api/v1/auth.py:46-75`; `alembic/versions/ae55bf25660c_create_login_attempts_table.py`; verified in `tests/test_login_hardening.py` (3 passed) | None. |
| **F-1.7** | **Frontend foundations:** One shell (`SaasSidebar`, `SaasHeader`), remove duplicate layouts (`sidebar.tsx`, `header.tsx`), RBAC-driven nav. | **Partial** | Duplicate layouts deleted; `apps/web/components/layout/saas-sidebar.tsx` filters by role permissions | `<PageReady />` contract missing on all data pages; loading skeletons still present in route captures. |

---

## 2. Master Prompt §6: Phase 2 Module Completion (M1–M15)

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|
| **M1.1** | **Users CRUD & status:** `GET/POST /users`, `GET/PATCH /users/{id}`, `POST /users/{id}/deactivate\|reactivate`. | **Not started** | None | No `users.py` router exists; user status mutations only exist partially via `roles.py`. |
| **M1.2** | **User invite flow:** `POST /users/invite` creates user with `must_set_password` and emails one-time link. | **Not started** | None | Endpoint and email dispatch missing. |
| **M1.3** | **Password reset flow:** `POST /auth/forgot-password`, `POST /auth/reset-password` (hashed token, 30 min expiry, single use). | **Not started** | None | No password reset endpoints; login page "Forgot password?" link leads nowhere. |
| **M1.4** | **Password change & session revoke:** `POST /auth/change-password` (revokes other sessions), `GET /auth/sessions`, `DELETE /auth/sessions/{id}`. | **Not started** | None | Models exist in `auth.py`, but endpoints are missing. |
| **M1.5** | **Agency settings:** `GET/PATCH /settings` (org name, GSTIN, address, invoice prefix, FY start, working hours, late threshold, weekly offs, holidays). | **Not started** | `app/db/models/common.py:53` (`SystemSetting`) | Model exists; no router or UI exists for organization settings. |
| **M1.6** | **Audit log viewer:** `GET /audit-logs` (admin only, filters by user, resource, action, date). | **Not started** | `app/db/models/common.py:12` (`AuditLog`) | Model and helper exist; endpoint and admin UI viewer missing. |
| **M1.7** | **Settings UI:** `/internal/settings` with tabs Organisation, Users, Roles, Holidays, Audit Log, My Account. | **Partial** | `apps/web/app/internal/settings/roles/page.tsx` | Only Roles tab exists; Organisation, Users, Holidays, Audit Log, and My Account tabs missing. |
| **M2.1** | **Services catalogue backend:** `POST /services`, `PATCH /services/{id}`, `POST /services/{id}/deactivate`, pricing types (`one_time`, `monthly`, `yearly`, `custom`). | **Done** | `apps/api/app/api/v1/services.py`; verified in `tests/test_services.py` | None. |
| **M2.2** | **Services catalogue UI & packages:** Real offerings seeded (Website, SEO, Calling, LinkedIn, Podcast, Reels), packages (Basic ₹30k, Gold ₹50k, Platinum ₹1L, Customisable) with editable line items. | **Partial** | `apps/web/app/internal/services/page.tsx` | Basic catalogue cards render live data; package tier builder and line-item inclusions missing. |
| **M3.1** | **Leads CRUD & soft delete:** `PATCH /leads/{id}`, `DELETE /leads/{id}` (soft), `POST /leads/{id}/assign`. | **Done** | `apps/api/app/api/v1/leads.py:90-195`; verified in `tests/test_leads.py` | None. |
| **M3.2** | **Leads state machine:** `new → contacted → qualified → proposal_sent → negotiation → won \| lost`, `on_hold` handling, `lost_reason` required. | **Done** | `apps/api/app/api/v1/leads.py:124-150`; verified in `tests/test_leads.py` | None. |
| **M3.3** | **Lead activities & follow-ups:** `GET/POST /leads/{id}/activities`, `GET /leads/follow-ups?due=today\|overdue\|week`. | **Partial** | `apps/api/app/api/v1/leads.py:200-240` (activities CRUD) | `GET /leads/follow-ups` endpoint missing. |
| **M3.4** | **Lead duplicate detection & CSV import:** 409 on duplicate phone/email/company+city; `POST /leads/import` with preview and row errors. | **Not started** | None | Duplicate check and CSV import endpoint missing. |
| **M3.5** | **Idempotent lead convert:** `POST /leads/{id}/convert` creates client, primary contact, opportunity link; idempotent. | **Done** | `apps/api/app/api/v1/leads.py:270-350`; verified in `tests/test_crm_finance.py::test_lead_conversion_idempotence` | Opportunity link on convert needs automated verification. |
| **M3.6** | **Leads UI:** Kanban/table toggle, drag between stages with 409 rollback, timeline composer, follow-up scheduler, `<Can>` convert button. | **Partial** | `apps/web/app/internal/leads/page.tsx`; `apps/web/app/internal/leads/[id]/page.tsx` | Kanban drag-and-drop rollback missing; follow-up scheduler UI missing. |
| **M4.1** | **Proposals backend:** Line items, server-calculated GST totals, status machine (`draft → sent → viewed → accepted \| rejected \| expired`). | **Partial** | `apps/api/app/api/v1/proposals.py`; `tests/test_proposals.py` | Version N+1 on edit after sent missing; automatic agreement/project generation on accepted missing. |
| **M4.2** | **Proposals PDF & Send:** `POST /proposals/{id}/send`, `GET /proposals/{id}/pdf` with agency branding. | **Partial** | Basic PDF generation stubbed | Formal PDF template matching invoice styling missing. |
| **M4.3** | **Proposals UI:** Pipeline board, value per stage, weighted forecast, line-item editor, version history. | **Partial** | `apps/web/app/internal/opportunities/page.tsx` | Renders proposals, but weighted forecast math and version history missing. |
| **M5.1** | **Client 360 backend:** `PATCH /clients/{id}`, `POST /clients/{id}/archive`, contacts CRUD, GSTIN checksum validation, state code extraction. | **Partial** | `apps/api/app/api/v1/clients.py` | GSTIN regex & checksum validator missing; detail endpoint 404s when requested with slug `cli-apex-01` (expects UUID). |
| **M5.2** | **Client portal invite:** `POST /clients/{id}/contacts/{cid}/portal-invite` creating client user with portal role. | **Partial** | Logic in `clients.py:quick_create` | Standalone contact portal invite endpoint missing. |
| **M5.3** | **Client 360 UI:** Tabs for Overview, Contacts, Services, Projects, Proposals, Agreements, Invoices, Payments, Tickets, Files, Activity. | **Partial** | `apps/web/app/internal/clients/[id]/page.tsx` | Page fails to load data when URL is `/internal/clients/cli-apex-01` due to backend 404; tabs lack individual empty states. |
| **M6.1** | **Agreements backend:** Status machine (`draft → sent → signed → active → expired`), renewal reminders at 30 and 7 days, `POST /{id}/terminate`. | **Partial** | `apps/api/app/api/v1/agreements.py` | State machine transitions, renewal reminder notifications, and termination endpoint missing. Detail route 404s on `agr-apex-msa-01`. |
| **M6.2** | **Agreements signed copy & portal signing:** `POST /{id}/upload-signed`, portal signing capturing name, IP, timestamp. Read-only once signed. | **Partial** | `agreements.py:sign_agreement` | IP capture and PDF signed document upload missing. |
| **M6.3** | **Agreements UI:** Internal agreements list/detail, portal agreement review and sign. | **Partial** | `apps/web/app/internal/agreements/page.tsx`; `apps/web/app/portal/agreements/page.tsx` | Detail page fails with 404 on slug ID; portal signing confirmation screen needs polish. |
| **M7.1** | **Projects state machine:** `not_started → planning → in_progress → internal_review → client_review → (revision → in_progress) \| completed`, `on_hold`, `cancelled`. Transition via `POST /{id}/transition`. | **Partial** | `apps/api/app/api/v1/projects.py:400` (`PUT /projects/{id}/stage`) | Uses `PUT` with stage string instead of strict `POST /{id}/transition {to, reason}` state machine. |
| **M7.2** | **Project members & scoping:** `GET/POST/DELETE /projects/{id}/members`, `assigned` scope restricted to members. | **Partial** | Models in `projects.py` | Dedicated members CRUD endpoints missing. |
| **M7.3** | **Milestones & deliverables:** Milestones CRUD with progress = completed tasks / total tasks; deliverables with versioning and client review. | **Partial** | `projects.py:list_pending_deliverables`, `review_deliverable` | Milestones CRUD endpoints and deliverable file upload versioning missing. |
| **M7.4** | **Project comments:** Polymorphic comments on project/task/deliverable, `internal_only` excluded from portal JSON. | **Not started** | `app/db/models/projects.py:Comment` | Comment model exists; API router and portal exclusion filter missing. |
| **M7.5** | **Projects UI:** Stage chevron bar, milestones timeline, task board, deliverables version history, internal/external comment thread. | **Partial** | `apps/web/app/internal/projects/page.tsx`; `apps/web/app/internal/projects/[id]/page.tsx` | Chevrons render status but don't enforce legal transition clicks; comments thread missing. |
| **M8.1** | **Tasks backend:** `tasks.py` router, single query with multi-assignee, status machine (`todo → in_progress → in_review → completed`, `blocked` with reason), checklist items. | **Partial** | `apps/api/app/api/v1/tasks.py` | Basic task CRUD exists; checklist items and blocked-with-reason state transition missing. |
| **M8.2** | **Tasks UI:** Single request for list, views My Tasks / Team / Overdue, quick-add on `Enter`, IST due date picker. | **Partial** | `apps/web/app/internal/tasks/page.tsx` | Calls `GET /tasks` once, but quick-add on `Enter` and checklist UI missing. |
| **M9.1** | **Invoicing atomic sequence (V-06):** `document_sequences` table, `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, no client `invoice_number` accepted (422). | **Done** | `apps/api/alembic/versions/35f9fb7af7b2_add_document_sequences_table.py`; `apps/api/app/api/v1/invoices.py:100-240`; verified in `test_invoices_atomic.py` (5 passed) | 20-thread HTTP endpoint concurrency test required in Stage 3. |
| **M9.2** | **Invoicing GST & status machine:** Auto-derived GST (Karnataka 29 vs inter-state), status machine (`draft → issued → partially_paid → paid → overdue`), auto credit note on cancel. | **Partial** | GST derivation verified in `test_invoices_atomic.py` | Overdue cron/query evaluation and auto credit note on invoice cancellation missing. |
| **M9.3** | **Payments & credit notes:** Reject amount ≤ 0 or > balance (409), payment modes, reference number required, `POST /payments/{id}/void`. | **Partial** | `invoices.py:record_invoice_payment`, `issue_credit_note` | `POST /payments/{id}/void` missing; payment reference requirement not strictly validated on non-cash modes. |
| **M9.4** | **Invoice PDF:** GSTIN of both parties, place of supply, HSN/SAC, tax breakup, Indian numbering in words (lakh, crore), bank details from settings. | **Partial** | `invoices.py:generate_invoice_pdf` | Basic PDF generated via fpdf2; amount in words and settings bank details missing. |
| **M9.5** | **Invoicing UI:** Client & service pickers, live tax preview, record payment drawer, download PDF. Portal shows issued invoices only. | **Partial** | `apps/web/app/internal/invoices/new/page.tsx`; `apps/web/app/internal/invoices/[id]/page.tsx` | `/portal/invoices` stuck on "Loading invoices..." because query does not hydrate properly before screenshot. |
| **M10.1** | **Support tickets backend:** Status machine (`open → in_progress → waiting_on_client → resolved → closed`), SLA due times in IST skipping holidays/weekends, breach flag, `internal_only` comments. | **Partial** | `apps/api/app/api/v1/support.py` | Basic tickets CRUD exists; SLA business hours calculation, auto-closure after 7 days, and internal notes portal stripping missing. |
| **M10.2** | **Support tickets UI:** Internal inbox with split-view thread; portal support with create, my tickets, reply, attach. | **Partial** | `apps/web/app/internal/support/page.tsx`; `apps/web/app/portal/support/page.tsx` | Split-view thread and attachment upload missing. |
| **M11.1** | **HR departments & employees backend:** Departments CRUD, employees CRUD linked to `User`, `department` scope. | **Not started** | Models in `app/db/models/hr.py` (`Department`, `Employee`) | Routers for departments and employees missing. |
| **M11.2** | **Attendance rules & export:** Check IST rules, late threshold, half-day under X hours, no double punch-in, corrections approval, CSV export. | **Partial** | `apps/api/app/api/v1/attendance.py` | Punch-in/out and correction requests exist; settings-driven threshold validation and CSV export missing. |
| **M11.3** | **Leave ledger & balances:** Leave balances, ledger, requests; approving leave debits ledger in same transaction; balance checks; exclude weekends/holidays. | **Partial** | Models exist; basic leave request in `attendance.py` | Transactional ledger debit on approval and weekend/holiday exclusion missing. |
| **M11.4** | **Timesheets:** `POST/GET /timesheets`, weekly submit and manager approval. | **Not started** | `app/db/models/hr.py:Timesheet` | Model exists; router and manager approval workflow missing. |
| **M11.5** | **Team & HR UI:** Live directory, attendance calendar heatmap, punch card, corrections queue, leave apply/approve, timesheet grid. | **Partial** | `apps/web/app/internal/attendance/page.tsx`; `apps/web/app/internal/team/page.tsx` | Attendance shows loading skeleton; leave balances and timesheet grid missing. |
| **M12.1** | **StorageService (Files):** `LocalStorage` (dev) and `S3Storage` (R2), `POST /files` (max 25 MB, MIME allow-list, SHA-256), `GET /files/{id}/url` with presigned URLs after scope check. | **Not started** | `app/db/models/common.py:FileAsset` | Model exists; `StorageService` class, upload router, and presigned URL router missing. |
| **M12.2** | **Notifications triggers:** `GET /notifications`, mark read. Triggers on assignment, mention, approval needed, invoice overdue, SLA breach, leave decision, agreement expiring. | **Partial** | `apps/api/app/api/v1/notifications.py` | Read and list endpoints exist; automated event triggers across modules missing. |
| **M12.3** | **Files & Notifications UI:** Bell in `SaasHeader` with unread count, polling every 60 s, `<FileDropzone />` component. | **Partial** | Header bell icon exists | Polling unread count and `<FileDropzone />` component missing. |
| **M13.1** | **Scoped Executive Dashboard:** `GET /dashboard/kpis` responding under 500 ms, revenue trend, revenue by service, funnel conversion %, active projects progress, tickets breaching SLA, attendance summary. | **Partial** | `apps/api/app/api/v1/dashboard.py` | Basic metrics exist; 12-month revenue trend, SLA breaches, and attendance summary missing. |
| **M13.2** | **Dashboard UI:** Delete all constants in `dashboard/page.tsx`, widgets rendered per permission, numbers deep-link to filtered lists. | **Partial** | `apps/web/app/internal/dashboard/page.tsx` | Hardcoded mock data deleted, but page shows loading skeletons in screenshots; deep-links missing. |
| **M14.1** | **Reports backend:** 8 reports (`sales-pipeline`, `revenue`, `receivables-ageing`, `gst-summary`, `project-status`, `team-utilisation`, `attendance-monthly`, `support-sla`), CSV streaming. | **Partial** | `apps/api/app/api/v1/reports.py:get_reports_overview` | Single overview endpoint exists; 8 dedicated report endpoints and CSV streaming missing. |
| **M14.2** | **Reports UI:** Report picker, presets, chart + table, real CSV download. | **Partial** | `apps/web/app/internal/reports/page.tsx` | Shows loading skeleton; CSV download button not functional. |
| **M15.1** | **Client portal role matrix:** `client_owner` (all), `client_manager` (projects/approvals/tickets), `client_finance` (invoices/agreements), `client_employee` (tasks/uploads). Enforced in API and UI. | **Not started** | None | All portal users currently share a single client check without role subdivision. |
| **M15.2** | **Client portal pages:** `/portal`, `/portal/projects`, `/portal/approvals`, `/portal/invoices`, `/portal/agreements`, `/portal/support`. Real data, no constants, mobile 375 px usable. | **Partial** | All portal page files exist | Data hydration fails in route sweep (screenshots show "Loading invoices...", skeletons, or only `/auth/me` calls). |

---

## 3. Master Prompt §7: Phase 3 Design, Polish & Quality

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|
| **P-7.1** | **Design system consistency:** Uniform page-header pattern, one table component, status badge palette mapped once in `lib/status.ts`. | **Not started** | `apps/web/lib/tokens.ts` | `lib/status.ts` missing; table and header patterns vary across pages. |
| **P-7.2** | **Number & date formatting:** `₹1,23,456.00` (`en-IN`), dates as `14 Nov 2026`, times in IST with "IST" label, relative time for activity. | **Partial** | Inline formatting on some pages | Central formatting helpers missing. |
| **P-7.3** | **Responsive layouts:** Tested and usable at 375 px, 768 px, 1280 px, and 1600 px. Tables collapse to cards on mobile. | **Partial** | Tailwind responsive classes present | Systematic mobile viewport verification missing. |
| **P-7.4** | **Accessibility (WCAG 2.1 AA):** Focus rings, modal focus trap, icon buttons have `aria-label`, contrast ratio ≥ 4.5:1, `aria-describedby` on form errors. | **Not started** | None | Full accessibility audit not performed. |
| **P-7.5** | **Performance & microcopy:** Route-level `loading.tsx`, dynamic import for Recharts, list pages < 200 KB JS, LCP < 2.5 s. Verb-based action buttons. | **Partial** | `loading.tsx` files present | Dynamic import of Recharts and JS bundle audit not completed. |
| **P-7.6** | **Gate 3 Verification:** Lighthouse desktop ≥ 90 Performance, ≥ 95 Accessibility on dashboard/leads/invoices/portal; axe DevTools 0 critical/serious violations. | **Not started** | None | Lighthouse and axe audits not yet executed. |

---

## 4. Master Prompt §8: Phase 4 QA Loop, Test Suites & CI

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|
| **QA-8.1** | **Route sweep inventory:** Every internal (18+ routes), portal (6 routes), and shared route visited and verified. | **Partial** | `docs/qa/baseline-sweep.json` (38 routes) | Screenshots show loading skeletons and "Loading invoices..."; `[data-testid="page-ready"]` contract missing; client/agreement detail routes 404. |
| **QA-8.2** | **Module QA loop execution:** Plan → Test → Log → Diagnose → Fix → Verify → Repeat until 0 open P0/P1 bugs. | **Partial** | `docs/qa/BUGS.md` | Followed for B-01..B-22 and V-01..V-06, but incomplete for M1, M6, M7, M10, M11, M12, M14, M15. |
| **QA-8.3a** | **Test harness isolation:** Per-test transaction rollback with savepoints, factory fixtures, test schema created via alembic migrations (not `create_all`). | **Partial** | `apps/api/tests/conftest.py` | Tests run against Neon Postgres, but use `Base.metadata.create_all` rather than running Alembic migrations, and lack per-test savepoint rollback. |
| **QA-8.3b** | **RBAC matrix test suite (`test_rbac_matrix.py`):** Parametrised test across every role × every endpoint in `/openapi.json`. | **Not started** | None | Test file does not exist. |
| **QA-8.3c** | **Client portal isolation suite (`test_portal_isolation.py`):** Two seeded clients (A and B); swaps IDs across every portal endpoint; expects 403/404 and zero data leak. | **Partial** | Basic assertion in `test_scoping.py` | Dedicated multi-endpoint A/B portal isolation suite missing. |
| **QA-8.3d** | **State machines test suite (`test_state_machines.py`):** Table-driven tests of every legal and illegal transition across leads, proposals, projects, tasks, invoices, tickets, agreements, and leave. | **Not started** | None | Test file does not exist. |
| **QA-8.3e** | **Financial correctness & concurrency suite (`test_money.py`, `test_sequences.py`):** GST intra/inter-state, per-line rounding, 20 concurrent HTTP invoice creations, FY rollover at 1 April IST. | **Partial** | `tests/test_invoices_atomic.py` (5 passed) | Concurrency tested 8 threads in-process; needs 20 concurrent HTTP requests against FastAPI and FY rollover test. |
| **QA-8.3f** | **Code coverage:** ≥ 85% line coverage on `app/api` and `app/policies` via `pytest --cov`. | **Not started** | None | Coverage report not configured or generated. |
| **QA-8.3g** | **Frontend Vitest component tests:** Unit tests for `<Can>`, `<PageReady>`, status badges, Zod form validators, money/date formatters. | **Not started** | None | Vitest not configured in `apps/web`. |
| **QA-8.3h** | **Playwright golden journeys (5 journeys):** 1. Lead-to-Paid full lifecycle; 2. Employee punch & leave; 3. Support ticket & internal note; 4. Admin custom role assignment; 5. Cross-tenant security breach. | **Not started** | None | None of the 5 golden journey specs exist in `apps/web/e2e/`. |
| **QA-8.4** | **Continuous Integration (`.github/workflows/ci.yml`):** Postgres 16 service, alembic upgrade, ruff, mypy, pytest with coverage, eslint, tsc, vitest, build, Playwright. | **Not started** | None | `.github/workflows/ci.yml` does not exist. |

---

## 5. Master Prompt §10: Phase 5 Deployment

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|
| **D-10.1** | **Vercel + Neon deployment:** Preview & Production environments, Neon `main` (prod) vs branch per PR, `DATABASE_DIRECT_URL` for migrations. | **Not started** | `vercel.json` exists | Not deployed to Vercel. |
| **D-10.2** | **Production seeds:** Split into `seed_core.py` (org, roles, admin) and `seed_demo.py` (dev only). Zero client data in production. | **Partial** | `scripts/dev_only/seed_pdf_data.py` | `seed.py` needs explicit split into `seed_core.py` and `seed_demo.py`. |
| **D-10.3** | **Post-deployment smoke script:** Automated verification of `/api/v1/health`, login, CRUD lead, logout. `/docs` returns 404 in prod. | **Not started** | None | Smoke script missing. |
| **D-10.4** | **Clean production secrets & README:** Zero secrets in git history; README rewritten with setup, env table, commands, and QA guide. | **Partial** | Default password removed from README | Full production deployment documentation missing. |

---

## 6. Remediation Findings (V-01 through V-10 & R3-01 through R3-10)

| Ref | Issue / Finding | Status | Evidence (file:line / test / commit) | Gap |
|---|---|---|---|---|
| **V-01** | Seeded credentials exposed on login page & README | **Done** | `apps/web/app/(auth)/login/page.tsx`; `README.md`; commit `9794ff9` | None. |
| **V-02** | Route sweep captured loading spinners / 10.8 KB blank screens | **Partial** | Storage states created; screenshots >25 KB | Skeletons still present; `[data-testid="page-ready"]` contract missing (R3-01). |
| **V-03** | Permissive RBAC redirection; sales on `/roles` and client on `/dashboard` | **Done** | `apps/api/app/policies/rbac.py`; `apps/web/e2e/stage-a.spec.ts` (passed); commit `2fc3144` | None. |
| **V-04** | API unreachable treated as session expired / logout | **Done** | `apps/web/context/auth-context.tsx`; `<ServiceUnavailable />`; commit `9794ff9` | None. |
| **V-05** | Tests ran on SQLite bypassing Postgres constraints | **Done** | `digitalfootprint_os.db` deleted; `apps/api/tests/conftest.py` strict guard; commit `253f0be` | Savepoint rollbacks and alembic migration execution per test needed (R3-04). |
| **V-06** | Invoice sequences non-atomic & client invoice number accepted | **Done** | `alembic/versions/35f9fb7af7b2`; `invoices.py:100-240`; commit `f6325cd` | 20-thread HTTP endpoint test needed (R3-05). |
| **V-07** | Five Playwright golden journeys missing | **Not started** | None | Specs need to be created in `apps/web/e2e/`. |
| **V-08** | Missing suites (RBAC matrix, portal isolation, state machines, CI) | **Not started** | None | Test suites need to be created. |
| **V-09** | Gate process skipped without owner approval | **Done** | Rule R12 enforced; waiting for owner approval on this baseline | None. |
| **V-10** | Mislabelled backlog IDs | **Done** | Corrected in `docs/qa/BUGS.md` | None. |
| **R3-01** | Screenshots show grey loading skeletons, not hydrated data | **Partial** | Skeletons identified in `dashboard`, `clients/cli-apex-01`, `reports` | Needs Step 2 diagnosis, root-cause fixes, and `page-ready` contract. |
| **R3-02** | Authenticated pages made only `/auth/me` and `/notifications` | **Partial** | `baseline-sweep.json` confirmed `apiRequests` satisfied by `/auth/me` | Needs per-route expected primary endpoint assertions in sweep v3. |
| **R3-03** | Route sweep correctness & detail 404s (`cli-apex-01`, `agr-apex-msa-01`) | **Partial** | 404s confirmed in server log during sweep | Detail endpoints expect UUID while seed uses slug IDs. Needs dual slug/UUID lookup. |
| **R3-04** | Test isolation uses `create_all` and lacks per-test transaction rollback | **Partial** | `tests/conftest.py` runs on Postgres | Replace `create_all` with `alembic downgrade/upgrade` and nested SAVEPOINT rollback per test. |
| **R3-05** | Concurrency proof was 8-thread function call, not 20-request HTTP endpoint | **Partial** | In-process test passed | Write 20-request concurrent `POST /invoices` integration test against HTTP endpoint. |
| **R3-06** | Stage D missing modules (M1, M6, M7, M10, M11, M12, M14, M15) | **Partial** | Requirements cataloged in this matrix | Implement modules one by one per Step 4. |
| **R3-07** | Stage E required test suites missing | **Not started** | Requirements cataloged in this matrix | Implement test suites per Step 5. |
| **R3-08** | Stage F polish, deploy, compliance | **Not started** | Requirements cataloged in this matrix | Execute per Step 6. |
| **R3-09** | 191 ESLint warnings, 37 pytest warnings, ruff omitted `scripts/` | **Partial** | ESLint 0 errors / 191 warnings; ruff clean on `app/ tests/` | Resolve or comment ESLint rules, fix pytest warnings, include `scripts/` in ruff. |
| **R3-10** | Process: No scope substitution allowed (Rule R12) | **Done** | Acknowledged and strictly enforced. | None. |

---

## 7. Master Prompt §11: Definition of Done Audit

| # | Condition | Current Status | Evidence / Notes |
|---|---|---|---|
| 1 | Every route in §8.1 renders real data with loading, empty, and error states; no hardcoded sample data. | **Partial** | Sample data deleted; 38 routes exist; but loading skeletons and 404s on detail slugs remain to be fixed in Step 2. |
| 2 | Every model in `app/db/models/` reachable through a scoped, tested API. | **Partial** | Models for Department, Employee, Timesheet, Storage, SystemSetting, polymorphic Comments lack routers. |
| 3 | Every status field changes only through a validated state machine with tests. | **Partial** | Implemented on Leads and Proposals; missing on Projects, Support Tickets, Agreements, and Leave. |
| 4 | Every role in `ROLE_MATRIX` and portal roles pass automated RBAC matrix, scoping, and isolation suites. | **Partial** | Scoping implemented in `scoping.py`; automated matrix test across all endpoints missing. |
| 5 | Money exact to paise, invoice numbers sequential per FY & collision-free, GST correct for intra/inter-state. | **Done** | Integer paise math, `document_sequences` table, auto GST derivation verified in `test_invoices_atomic.py`. |
| 6 | Every write is atomic with its audit log. | **Done** | `log_audit_event()` non-committing; transactional context verified in `test_audit_atomicity.py`. |
| 7 | CI is green: ruff, mypy, pytest ≥ 85% coverage, lint, tsc, vitest, build, Playwright. | **Partial** | `tsc`, `lint`, and `ruff` pass; `mypy`, coverage, Vitest, CI workflow missing. |
| 8 | Lighthouse (≥90/95) and axe targets met. | **Not started** | Not yet executed. |
| 9 | Deployed on Vercel + Neon with smoke test passing. | **Not started** | Not yet deployed. |
| 10 | `docs/qa/` contains complete audit, empty P0/P1 bug list, per-module progress with evidence, plain-English notes. | **Partial** | `AUDIT.md`, `BUGS.md`, `PROGRESS.md`, `SPEC_COMPLIANCE.md` active. |

---

## 8. Summary of Baseline Metrics

- **Total Requirements Tracked:** 62
- **Done:** 12 (19.4%)
- **Partial:** 31 (50.0%)
- **Not started:** 19 (30.6%)
