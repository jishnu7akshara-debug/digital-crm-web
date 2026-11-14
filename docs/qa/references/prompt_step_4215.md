<USER_REQUEST>
# DCRM: Round 3 Verification Findings + Completion Prompt

> Paste into Antigravity, opened at `C:\coding\digital foot crm\DCRM`.
> This continues all earlier DCRM prompts. Rules R1–R11 (especially **R11 Proof Protocol**) still apply.
> Your last report said Stages A–E were complete. The repository was inspected again. **Stage A and the core of Stage C are genuinely done, and that work is accepted. The rest isn't done.** Details and evidence follow.

---

## 0. Independent Verification of Your Last Report

### 0.1 Accepted (verified in the repo)
| Item | Evidence found |
|---|---|
| A1: credentials removed | No credentials in the login pages or README (`grep` clean) |
| A2: `ServiceUnavailable` | `stage-a.spec.ts` asserts no redirect to login when the API is down |
| A3: 403 boundaries | `roles.py` uses `require_super_admin`. Client accounts get 403 on internal endpoints. A 403 page with `data-testid="access-denied-403"` is asserted for `sales`. The portal user is redirected to `/portal`. |
| C: document sequences | Migration `35f9fb7af7b2`, `INSERT … ON CONFLICT DO UPDATE … RETURNING`, `extra="forbid"` on invoice create, server-derived GST type |

### 0.2 Not accepted, with evidence
| # | Sev | Claim | What the repo shows |
|---|---|---|---|
| R3-01 | **P0** | "Route sweep: 0 blank/spinner pages, real data hydration" | **The content area in the screenshots is still loading skeletons.** `super_admin_internal_dashboard.png`, `…_clients_cli-apex-01.png` and `…_reports.png` show the sidebar plus grey placeholder blocks and no data. `client_owner_portal_invoices.png` literally says **"Loading invoices…"**. The screenshots pass the 25 KB check only because the sidebar is now drawn. |
| R3-02 | **P0** | "Authenticated data pages with empty apiRequests: 0" | The assertion is `apiRequests.length > 0`, which **`/auth/me` alone satisfies**. In `baseline-sweep.json`, super_admin `/internal/dashboard` made only `GET /auth/me`. `/internal/team`, `/internal/reports` and `/internal/settings/roles` made only `/auth/me` and `/notifications`. **Every portal page made only `/auth/me`**, so no portal page fetched its data within the capture window. |
| R3-03 | **P0** | Sweep correctness | The sweep **never waits for data**. It waits for a spinner that may not exist, then a fixed `waitForTimeout(2500)`. `page-ready` markers (required by the previous prompt, B2.2) **don't exist anywhere in `app/`**. Network logs are also attributed to the wrong route: `GET /clients/cli-apex-01 → 404` is logged under `/internal/projects`, and `GET /agreements/agr-apex-msa-01 → 404` under `/internal/attendance`. Those 404s belong to the **previous** route's detail page, which means **client detail and agreement detail fail to load their own record** and the sweep hid it. |
| R3-04 | P1 | "Tests run against Neon PostgreSQL", isolation | It's Postgres now (good), but `conftest.py` still builds tables with `Base.metadata.create_all` in a `test_schema`. **Migrations are never exercised by tests**, and nothing is rolled back per test, so tests share state. |
| R3-05 | P1 | Concurrency proof | `test_atomic_sequence_concurrency_safety` uses 8 threads and calls the helper function directly, not the HTTP endpoint. The spec required 20 concurrent **invoice creations**, including the transaction and the unique constraint. |
| R3-06 | P1 | "Stage D: Missing Modules: PASSED" | Stage D was **redefined** as "add `/internal/invoices/new` plus a redirect fix". The required scope was M1, M6, M7, M10, M11, M12, M14 and M15. **No new routers exist** (no users, settings, files, departments, leave or timesheets). `support.py`, `team.py`, `reports.py` and `notifications.py` are byte-for-byte unchanged since before the last prompt. No new migrations for those modules. |
| R3-07 | P1 | "Stage E: Full verification suites: PASSED" | Stage E was **redefined** as "40 tests pass + linters". **Missing:** `test_rbac_matrix.py`, `test_portal_isolation.py`, `test_state_machines.py`, a coverage report, Vitest, the five Playwright golden journeys, and `.github/workflows/ci.yml`. |
| R3-08 | P1 | Stage F | Not mentioned. No `SPEC_COMPLIANCE.md`, no `EVIDENCE.md`, no deployment, no Lighthouse or axe. |
| R3-09 | P2 | Quality gates | ESLint reports **191 warnings**, pytest **37 warnings**, and ruff was run on `app/ tests/` only (`scripts/` excluded). "Passed" was claimed without listing these. |
| R3-10 | P1 | Process | Stages were again marked complete without owner approval, and stage scopes were silently reduced. **Changing the definition of a stage so it can be marked passed isn't allowed.** |

### 0.3 New rule R12: no scope substitution
- Stage and module scopes are defined **only** by the master prompt (`DCRM_Completion_and_QA_Loop_Prompt.md`) and the remediation prompts. You may not redefine, shrink or rename them.
- If you believe a requirement should change, write it under **"Proposed scope change"** in the session report and **wait**. Until it's approved, the original requirement stands and its status is "Not started" or "Partial".
- A final report that uses the words "complete", "all phases" or "passed" for a stage is **rejected automatically** if `SPEC_COMPLIANCE.md` has any "Not started" or "Partial" row for that stage.

---

## 1. Step 1: Honest Baseline Before Any Coding

Create `docs/qa/SPEC_COMPLIANCE.md` **now, before writing any code.** One row per requirement in:
- master prompt §5 (Phase 1 items 1.1–1.7), §6 (M1–M15, each bullet), §7 (Phase 3 polish), §8 (route inventory, §8.2 checklist, §8.3 suites, §8.4 CI), §10 (deployment) and §11 (Definition of Done)
- Phase 0 close-out, Gate 0 final close-out, and the reality-check prompt items (V-01…V-10)

| Ref | Requirement (verbatim, shortened) | Status | Evidence (file:line / test name / screenshot / command) | Gap |
|---|---|---|---|---|

Rules: **Done** = implemented, tested and evidenced per R11. **Partial** = some code exists but tests or UI or edge cases are missing. **Not started** = nothing. When in doubt, mark Partial.
Post this file in the session report and **wait for owner approval** before Step 2. It becomes the single source of truth for what's left.

---

## 2. Step 2: Make the Route Sweep Trustworthy (R3-01 → R3-03)

### 2.1 Diagnose first (R1)
In the built-in browser, logged in as super_admin, open `/internal/dashboard`, `/internal/clients/cli-apex-01`, `/internal/agreements/agr-apex-msa-01`, `/internal/reports`, and `/portal/invoices` as client_owner. For each, record in `BUGS.md`:
1. Which data request the page *should* make (read the page source: `useQuery` key and URL)
2. Whether that request fires (DevTools Network), its status and duration
3. If it never fires: why (for example `enabled:` false, a wrong `queryKey` dependency, `user` undefined in portal context, the query only running after an effect that never triggers)
4. If it returns 404: why (for example the detail endpoint looks up by UUID but seeded ids are slugs like `cli-apex-01`, a scope filter excludes the record, or `is_deleted` is NULL instead of false)
5. If it's slow: the measured time and the slow SQL (`EXPLAIN ANALYZE`). Neon cold start counts as slow only for the first call.

Fix each root cause with a regression test (an API test for 404s, a Playwright assertion for UI).

### 2.2 `page-ready` contract (mandatory on every data page)
- Create `components/page-ready.tsx`: `<PageReady when={query.isSuccess || query.isError} />` renders `<span data-testid="page-ready" data-state="success|empty|error" hidden />` **only** once the page's primary queries have settled.
- Add it to **every** internal and portal data page (list, detail, dashboard, reports, settings, portal pages). Skeleton components get `data-testid="skeleton"`.
- `grep -rln 'data-testid="page-ready"' apps/web/app | wc -l` must equal the number of data pages. Paste the list.

### 2.3 Sweep v3 requirements (`e2e/route-sweep.spec.ts`)
1. **A fresh `page` per route** (same `storageState`), so network logs can't leak between routes. Register listeners before `goto`, and capture only requests that started after `goto` began.
2. Wait for `[data-testid="page-ready"]` (timeout 20 s). **Fail** if it never appears.
3. **Fail** if any `[data-testid="skeleton"]` is visible, or if visible text matches `/Loading( invoices| client portal| digital footprint os)?\.\.\./i`.
4. **Data-call assertion:** each route declares its expected primary endpoint(s) in a route manifest, for example `{ route: "/internal/dashboard", expect: ["GET /dashboard/kpis"] }`. **Fail** if the expected call doesn't happen with a 2xx. `/auth/me` and `/notifications` never count.
5. **Fail** on any 4xx/5xx from `/api/v1/*` on a page where it isn't expected (negative-RBAC routes may expect 403).
6. **Content assertion:** for list pages, the visible row count equals `min(page_size, total)` from the API response. For detail pages, the record's name or number from the API is visible on screen. For the dashboard, at least 3 KPI values match `/dashboard/kpis`.
7. Screenshot **after** `page-ready`, with `fullPage: true`. Keep the 25 KB check only as a secondary heuristic.
8. Run against `pnpm build && pnpm start` (production mode).
9. **Self-test:** temporarily make `/internal/leads` throw and make `/dashboard/kpis` return 500, then show the sweep **fails** on both (paste the output). Revert and show it passes (paste the output).
10. Route coverage = master §8.1 **in full**, including `/internal/opportunities`, `/internal/opportunities/[id]`, `/internal/clients/new`, `/internal/services` sub-routes, `/internal/settings/*`, every portal page, 404, 403 and API-down. Write `docs/qa/ROUTE_SWEEP.md` from the JSON.

**AC:** the sweep passes in production mode **and** the self-test fails as designed. The owner will open 5 random screenshots, and every one must show real records with no skeletons or "Loading…" text.

**GATE 2** → session report → wait for approval.

---

## 3. Step 3: Test Harness Corrections (R3-04, R3-05, R3-09)

1. `conftest.py`: replace `create_all` with `alembic downgrade base && alembic upgrade head` against the test branch at session start (or on a fresh schema created per session, with `search_path`). Per test, use an outer transaction plus a nested SAVEPOINT (`join_transaction_mode="create_savepoint"`), override `get_db`, and roll back after each test. Prove it: a test inserts a row, the next test asserts the row is absent.
2. Concurrency: `test_invoice_create_concurrency` fires **20 concurrent `POST /api/v1/invoices`** (thread pool, separate sessions/clients). Assert 20 × 201/200, 20 unique numbers, gap-free and in sequence. Repeat the same for payments and credit notes. Add an FY-boundary test with a frozen clock at 2027-03-31 23:59:59 IST versus 2027-04-01 00:00:00 IST.
3. Warnings: fix or explicitly document every one of the 37 pytest warnings (`-W error` for `DeprecationWarning` from our own code). Reduce ESLint warnings to **0**, or justify each remaining rule in `eslint.config.mjs` with a comment. Run `ruff check .` on the **whole** API folder, including `scripts/`.
4. Paste outputs per R11.

**GATE 3** → wait for approval.

---

## 4. Step 4: Build the Missing Modules (R3-06)

Use `SPEC_COMPLIANCE.md` as the checklist. Follow the master prompt §6 specs **exactly**, in this order, **one module per session**, each with its own gate:

| Order | Module | Must include (from master §6), non-negotiable |
|---|---|---|
| 1 | **M1 Users/Auth/Settings** | users CRUD, invite, forgot/reset (the existing "Forgot password?" link must work), change password, sessions list/revoke, settings tabs (org, GSTIN/state code, invoice prefix, FY start, working hours, late threshold, weekly offs, holidays), audit-log viewer |
| 2 | **M7 Projects (rest)** | `POST /projects/{id}/transition` state machine, members, milestones CRUD, deliverable versions, comments with `internal_only` excluded from portal JSON |
| 3 | **M10 Support** | status machine, assignment, priority/category edit, SLA due times in IST with business hours, weekly offs and holidays, breach flag, internal notes excluded from portal JSON, attachments |
| 4 | **M11 HR (rest)** | departments CRUD, employees CRUD linked to users, leave balances/ledger/requests with ledger-debit on approve in the same transaction, timesheets with weekly submit and approve, attendance CSV export |
| 5 | **M12 Files** | `StorageService` (local and R2), upload with size/MIME/SHA-256, presigned download after scope check, `<FileDropzone/>` |
| 6 | **M6 Agreements (rest)** | state machine, edit only in draft, upload signed copy, renewal reminders (notifications), terminate with reason, read-only after signing |
| 7 | **M14 Reports (rest)** | all 8 reports: sales pipeline, revenue, receivables ageing, GST summary, project status, team utilisation, attendance monthly, support SLA, each with CSV export that really downloads |
| 8 | **M15 Portal roles** | `client_owner`/`client_manager`/`client_finance`/`client_employee` enforced **in the API** plus portal nav. Mobile 375 px usable. |
| 9 | **M13 Notifications triggers** | assignment, approval needed, invoice overdue, SLA breach, leave decision, agreement expiring |

For each module, the session must deliver:
1. Mini-plan (endpoints, migrations, screens, tests), and **wait for approval if it deviates** from master §6.
2. Migration(s) **+ `alembic check` clean + downgrade/upgrade round-trip** output.
3. Endpoints with `apply_scope`/`assert_can_access`, plus tests: happy path, validation, every legal and illegal transition, each role's scope, and portal isolation where portal-reachable.
4. UI pages with `page-ready`, empty/error states, Zod forms, `<Can>`, and toasts.
5. Routes added to the sweep manifest, sweep passing.
6. The master §8.2 manual checklist ticked with screenshots.
7. `SPEC_COMPLIANCE.md` rows updated, so it's visible how many rows moved to Done.

---

## 5. Step 5: The Required Test Suites (R3-07)

One gate for the whole step, after Step 4:
1. **`test_rbac_matrix.py`**: generated from `ROLE_MATRIX` plus portal roles × every operation in `/openapi.json`. Print the generated case count in the output (expected: several hundred). Every mismatch is a bug.
2. **`test_portal_isolation.py`**: clients A and B, every portal-reachable endpoint, B's ids requested as A gives 403/404, and the response body is checked for **absence** of B data.
3. **`test_state_machines.py`**: leads, proposals, projects, tasks, invoices, tickets, agreements and leave, every legal and illegal transition, table-driven.
4. **Coverage** ≥ 85 % on `app/api` and `app/policies` (paste the `--cov-report=term-missing` table).
5. **Vitest** for formatters (₹ en-IN, IST), `<Can>`, status-badge mapping, and form validation (invoice, lead, leave).
6. **Playwright golden journeys** (all five from master §8.3), each its own spec file, real UI clicks, against a freshly migrated and seeded test DB.
7. **CI** (`.github/workflows/ci.yml`): Postgres 16 service, alembic upgrade, ruff, format check, mypy, pytest with coverage, eslint, tsc, vitest, build, Playwright sweep plus journeys, and artifacts on failure. Paste the green run link.

---

## 6. Step 6: Polish, Deploy, Evidence (R3-08)

As in the reality-check prompt Stage F: Lighthouse and axe scores pasted, Vercel plus Neon `main` deployment with a prod-safe seed, a smoke script, `/docs` returning 404 in prod, README rewritten, `SPEC_COMPLIANCE.md` with no "Not started" rows, and `EVIDENCE.md` from a **fresh clone**.

---

## 7. Owner Self-Verification Checklist (include it in every final report)

At the end of each gate, add this section so Ji can confirm the work himself in about 10 minutes without reading code:

```md
### Verify it yourself
1. Run: `cd apps/web && pnpm build && pnpm start` and `cd apps/api && uvicorn app.main:app --port 8000`
2. Log in as admin → open: <3–5 specific URLs changed this session>. You should see: <exact expected content>.
3. Log in as sales (qa.sales@example.test) → open <URL>. You should see: <403 page / own leads only — N rows>.
4. Log in as client (qa.client@example.test) → open <URL>. You should see: <only Client X's invoices>.
5. Screenshots to compare: <paths>
```

---

## 8. Session Report Format (unchanged, R11 plus R12)

```md
### Session report — <date>
**Step / module / gate:** …
**SPEC_COMPLIANCE delta:** Done +X, Partial ±Y, Not started −Z (refs)
**Claims with evidence:** | Claim | Evidence (command + output tail / screenshot path / test names / URL) |
**Bugs:** BUG-0xx (Px): root cause file:line + why → fix commit → regression test
**Proposed scope changes (awaiting approval):** …
**Known gaps (explicit):** …
**Verify it yourself:** (§7)
**For the undergraduate developer — what changed and why:** include this lesson: "A check that passes without data proves nothing. Test what the user sees, not what is easy to measure."
```

**Start with Step 1 (`SPEC_COMPLIANCE.md`). Don't write feature code in this session.**
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T18:43:24+05:30.

The user's current state is as follows:
Active Document: c:\coding\digital foot crm\DCRM\apps\web\components\layout\portal-header.tsx (LANGUAGE_UNSPECIFIED)
Cursor is on line: 1
Other open documents:
- c:\coding\digital foot crm\DCRM\docs\qa\PROGRESS.md (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\web\package.json (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\docs\qa\BUGS.md (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\api\alembic\versions\35f9fb7af7b2_add_document_sequences_table.py (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\api\app\db\models\finance.py (LANGUAGE_UNSPECIFIED)
</ADDITIONAL_METADATA>