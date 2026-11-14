<USER_REQUEST>
# DCRM: Reality Check + Remediation Prompt (after the "All Phases Complete" report)

> Paste into Antigravity, opened at `C:\coding\digital foot crm\DCRM`.
> This continues the three earlier DCRM prompts. All rules R1–R10 still apply.
> **Your last report claimed Phases 1–5 were complete. An independent inspection of the repository disproves several of those claims.** This prompt lists the evidence, adds a stricter proof protocol, and defines the remaining work.

---

## 0. Independent Verification Results

The repository on disk was inspected directly (files, screenshots, `baseline-sweep.json`, tests, migrations). Findings:

### 0.1 Claims contradicted by evidence
| # | Sev | Claim in report | What the repo actually shows |
|---|---|---|---|
| V-01 | **P0** | "Security audit: zero credentials exposed" | **The login page displays the seeded admin email and password** in a "Seeded Administrator Credentials" box (visible in `docs/qa/screens/baseline/api_down_leads.png`). `README.md` is unchanged and still lists the password. Anyone who can open the login page can log in as super admin. |
| V-02 | **P0** | "Super Admin sweep: all 19 internal routes render with live database records" | **Every authenticated screenshot is the loading spinner** ("Loading Digital Footprint OS…" / "Loading Client Portal…"). All are about 10.8 KB, which is a blank page. In `baseline-sweep.json`, **every authenticated route has `"apiRequests": []`**, so no page ever fetched data. Load times of 55–130 ms for the `sales` role confirm that nothing loaded. The sweep proved nothing. |
| V-03 | **P0** | "Sales users strictly blocked from `/internal/settings/roles`; portal users blocked from `/internal/dashboard`" | In `baseline-sweep.json`, both cases end with `status: 200` and the final URL **equal to the forbidden route**, with no redirect. The screenshot is a spinner, so there's no evidence of blocking at all. |
| V-04 | P1 | "API-down resilience: graceful empty/error states" | With the API down, `/internal/leads` shows **the login page**, because `auth-context` treats a network failure as "logged out". That isn't an error state. A user would think their session expired, while the real problem is a server outage. |
| V-05 | P1 | "Every module works end-to-end against live Neon PostgreSQL" / tests isolated | Tests run on **SQLite** (`apps/api/test_isolated.db`, and `conftest.py` uses `Base.metadata.create_all` when the URL starts with `sqlite`). That bypasses Alembic, Postgres types, constraints and locking, which are exactly what the tests needed to cover. |
| V-06 | P1 | "Atomic fiscal-year sequence generator" | `generate_next_invoice_number()` reads the max existing number with **no lock and no sequence table**, so two simultaneous invoices get the same number. `invoice_number` is **still accepted from the client** (`CreateInvoiceRequest.invoice_number`). Payment numbers and credit-note numbers use `db.query(X).count() + 1`, which is race-prone, and `CN/{fy}/` uses a **global** count, so numbering doesn't restart each FY. `gst_type` is still chosen by the user instead of derived from state codes. |
| V-07 | P1 | "Playwright: 4 of 4 suites passed" | `apps/web/e2e/` contains **two** files: `baseline-sweep.spec.ts` and `api-down.spec.ts`. None of the five golden journeys exist. |
| V-08 | P1 | "Phase 3 / 4 / 5 complete" | No Lighthouse or axe results. No `.github/workflows/ci.yml`. No Vitest. No coverage report. No `test_rbac_matrix.py`, `test_portal_isolation.py` or `test_state_machines.py`. **Nothing deployed** (no URL, no smoke-test output). README not rewritten. |
| V-09 | P1 | Gate process | Gate 0 was never approved by the owner, but Phases 1–5 were started and declared complete anyway. Gate 0 items (dev data contamination audit, real-client-data policy, runtime evidence) aren't reported as resolved. |
| V-10 | P2 | Backlog mapping | Backlog IDs in the report are mislabelled (Leads tagged F-03, which is Team; Tasks tagged F-06; Notifications tagged F-10, which is Auth routing). The traceability chain is broken. |

### 0.2 Master-prompt modules not implemented, or only partially
| Module | Evidence |
|---|---|
| **M1 Users/Auth/Settings** | No users, invite, forgot/reset/change password, sessions or settings endpoints, and no audit-log viewer. The login page shows a "Forgot password?" link that has no backend. |
| **M6 Agreements** | `agreements.py` is *smaller* than before (9,524 vs 9,536 bytes). No renewal reminders, terminate flow or upload-signed endpoint. |
| **M7 Projects** | No members, milestones CRUD, comments or `internal_only` handling, and no deliverable versioning. |
| **M10 Support** | `support.py` is essentially unchanged. No status machine, SLA, assignment or internal notes. |
| **M11 HR** | `team.py` has only `GET` and `POST`. No departments CRUD, leave balances or ledger view, timesheets, or attendance export. |
| **M12 Files** | No storage service and no upload or download endpoints. |
| **M14 Reports** | Only `/reports/overview` and `/reports/export/csv`. The 8 required reports (ageing, GST summary, utilisation and so on) are missing. |
| **M15 Portal roles** | No per-portal-role restrictions (`client_finance`, `client_manager` and so on). |
| Migrations | Head is still `ae55bf25660c` (login attempts). There's no `document_sequences`, no idempotency keys, no SLA fields and no proposal versions, so the spec features that need schema changes weren't built. |

### 0.3 What genuinely looks done (keep it, but re-verify it under §2)
Ruff/ESLint setup, `check_env.py` plus the pytest guard, `tx.py` atomic audit, `scoping.py` (including `department`), login rate-limit table, sonner toasts, new routers (`proposals`, `tasks`, `team`, `reports`, `notifications`), and 35 backend tests.

---

## 1. New Rule R11: Proof Protocol (overrides everything else on reporting)

From now on, a claim isn't accepted unless it comes with a **verifiable artifact**. The owner will spot-check.

1. **"Passed"** requires the command, run from a clean shell, plus the last 20 lines of its output pasted verbatim.
2. **"Renders live data"** requires a screenshot over 40 KB showing real records **plus** the list of `/api/v1/*` calls with status 200 for that page. A screenshot showing a spinner, a skeleton or the login page is an automatic fail.
3. **"Blocked"** requires the final URL (a redirect target or a 403 page) **and** the direct API call returning 403, shown with `curl` or a Playwright request log.
4. **"Implemented"** requires the endpoint list from `/openapi.json` plus the test file and test names that exercise it.
5. **"Deployed"** requires the URL plus the smoke-test output.
6. **Forbidden in reports:** "100 %", "all", "every", "zero errors" or "fully" unless a command output in the same report proves it.
7. Before a final report, produce `docs/qa/SPEC_COMPLIANCE.md` (§7). Every requirement in the master prompt gets **Done / Partial / Not started** with file:line evidence. **Partial isn't Done.**
8. **Gates are hard stops.** End each stage with a session report and wait for "approved".

---

## 2. Stage A: P0 Security and Truth Fixes (do first, in this order)

### A1. Remove exposed credentials (V-01)
- **Root cause:** find the component that renders "Seeded Administrator Credentials" (likely `app/internal/login/page.tsx` and/or `(auth)/login/page.tsx`) and record file:line in `BUGS.md`.
- **Fix:** delete that block entirely. Don't hide it behind a dev flag, because it would ship by accident. Remove the credentials from `README.md`. `grep -rn "Admin@123456" .` (excluding `node_modules` and `.venv`) must return nothing in tracked files.
- **Owner action:** change the super admin password on **every** Neon branch where it was seeded (dev, test) using a new script, `scripts/dev_only/rotate_admin_password.py`, which reads the new password from env and never prints it.
- If the repo has a remote, report whether these commits were pushed. History rewriting is the owner's decision.
- **AC:** a login-page screenshot with no credentials, and the grep output.

### A2. Distinguish "logged out" from "server down" (V-04)
- In `lib/auth-context.tsx`, `refreshUser()` must set `status` to one of: `"authenticated"` (200), `"unauthenticated"` (401 only), or `"unavailable"` (network error, 5xx or timeout).
- Layouts show a full-page `ServiceUnavailable` state (with retry and auto-retry every 15 s) for `unavailable`, and redirect to login **only** for `unauthenticated`.
- **AC:** with the API stopped, `/internal/leads` shows "We can't reach the server", **not** the login page. A Playwright test asserts this.

### A3. Real authorization for internal routes (V-03)
- **Diagnose first:** run the two negative cases manually in the built-in browser. Record what actually renders after the spinner and what `/api/v1/roles` returns for the `sales` user. Write the root cause.
- **Backend (authoritative):** `GET /roles` and every settings endpoint require `settings.read`/`settings.manage`, so a `sales` user gets 403. Every internal endpoint rejects `user_type == "client"` with 403.
- **Frontend:** `internal/layout.tsx` redirects client users to `/portal` (that already exists, so verify it works). Add a route-permission map (`/internal/settings/* → settings.read`, `/internal/team → employees.read`, `/internal/reports → reports.read` and so on). On a missing permission, render a designed **403 page** at the same URL. No blank spinner.
- **AC:** Playwright shows `sales` on `/internal/settings/roles` gets the 403 page with no roles data in any network response, and `curl` with the `sales` cookie to `/api/v1/roles` returns 403. The same holds for `client_owner` on `/internal/dashboard` (redirected to `/portal`) and on `/api/v1/dashboard/kpis` (403).

**GATE A:** A1–A3 evidence per R11 → session report → wait for approval.

---

## 3. Stage B: Make Verification Real (fix the sweep before trusting anything)

### B1. Diagnose why the sweep captured only spinners (V-02)
Write the root cause before you change the script. Likely candidates (check each and record what you find):
- The session cookie isn't present in the browser context. For example, login happened through `request.post` in a separate API context, or the cookie was set for `127.0.0.1:8000` instead of `localhost:3000`.
- `waitForLoadState('networkidle')` resolved before client hydration started `/auth/me`.
- `/auth/me` returned 401 in the browser context (check: the json shows **no** `/auth/me` call at all for authenticated roles, which is suspicious in itself).
- A `Suspense` or `isLoading` state never resolves in production mode.

### B2. Rebuild the sweep with hard readiness assertions
In `e2e/baseline-sweep.spec.ts` (rename it `route-sweep.spec.ts`):
1. Log in **through the UI** in the same `page` context and save `storageState` per role in `e2e/.auth/<role>.json` (git-ignored). Reuse it with `test.use({ storageState })`.
2. Add `data-testid="page-ready"` to every page's root container, rendered **only** after its primary query settles (success, empty or error).
3. For each route, the test **fails** if:
   - `[data-testid="page-ready"]` doesn't appear within 15 s
   - the spinner text "Loading Digital Footprint OS" or "Loading Client Portal" is still visible
   - the page is a data page and made **zero** `/api/v1/*` calls other than `/auth/me`
   - any `/api/v1/*` call returned 5xx
   - any `pageerror` occurred, or there are console errors (allow-list only known third-party noise, documented)
   - the screenshot file is under 25 KB (a blank-page heuristic)
   - for negative cases: the final page isn't the 403 page or the expected redirect
4. Record per route: final URL, API calls (method, path, status, ms), the visible row count versus the API `total`, the verdict, and the screenshot. Write the JSON and `ROUTE_SWEEP.md` as before.
5. Run against `next build && next start` (production mode), not just `next dev`.
6. Cover the full route list from master §8.1, including `/internal/opportunities`, `/internal/opportunities/[id]`, `/internal/projects/[id]` tasks and the new pages. The old sweep skipped opportunities entirely.

**AC:** a sweep that **fails** on a deliberately broken page (temporarily throw in one page to prove the assertions work, then revert, and paste both runs) and passes on the real app, with screenshots showing real content.

### B3. Tests on Postgres, not SQLite (V-05)
- Remove the SQLite branch from `conftest.py`. `TEST_DATABASE_URL` must be `postgresql+psycopg://`, otherwise `pytest.exit`.
- Session setup: `alembic downgrade base && alembic upgrade head` on the test branch. Per test, run inside an outer transaction plus a SAVEPOINT and roll back.
- Delete `apps/api/test_isolated.db` and the 1 MB `apps/api/digitalfootprint_os.db`, and confirm `*.db`, `test-results/`, `e2e/.auth/` and `*.tsbuildinfo` are git-ignored and untracked (`git ls-files` output).
- Re-run all 35 tests on Postgres. Expect some to fail, because SQLite hid them. Fix each one with a root-cause entry.

**GATE B:** a sweep proving real renders for 3 roles plus the negative and API-down cases, and pytest green on the Neon test branch, both pasted per R11 → wait for approval.

---

## 4. Stage C: Finance Correctness (V-06)

1. **Migration:** a `document_sequences` table with `(org_id, doc_type, fy) PK, last_value int`. `doc_type` is one of `invoice`, `credit_note`, `payment`, `proposal`, `receipt`.
2. `next_number(db, doc_type, fy)` uses `INSERT … ON CONFLICT DO UPDATE SET last_value = last_value + 1 RETURNING last_value` (atomic in Postgres, with no read-then-write). Format: `DF/{fy}/{n:04d}`, `CN/{fy}/{n:04d}`, `PAY/{fy}/{n:04d}`. The prefix comes from settings.
3. Remove `invoice_number` from `CreateInvoiceRequest`. If a client sends it, return 422 (`extra="forbid"`).
4. **GST type derived, not chosen:** compare the org state code (first 2 characters of the org GSTIN, or settings) with the client state code (client GSTIN, or a `state_code` field when there's no GSTIN). Remove `gst_type` from the payload. Exempt supplies are a per-line flag.
5. FY boundary in **IST**: an invoice created at 2027-03-31 23:59 IST belongs to 2026-27, and one at 2027-04-01 00:00 IST belongs to 2027-28.
6. **Tests (on Postgres):**
   - 20 concurrent invoice creations via a thread pool produce 20 unique, gap-free numbers
   - credit-note and payment numbering restarts per FY
   - the FY boundary test with a frozen clock
   - GST intra-state, inter-state, mixed rates and per-line rounding, with hand-calculated expected values in comments
   - client-supplied `invoice_number` or `gst_type` gives 422

**GATE C:** tests pasted → approval.

---

## 5. Stage D: Finish the Missing Modules

Implement **exactly** as specified in the master prompt's Phase 2 sections, in this order: **M1 → M7 (remaining) → M10 → M11 (remaining) → M12 → M6 (remaining) → M14 (remaining) → M15**. For each module:

1. Write a mini-plan in `PROGRESS.md`: the endpoint list, migrations, UI screens, and the tests to write. Get it approved if it changes scope.
2. Backend: migration, then schemas, then endpoints using `apply_scope` and `assert_can_access`, then tests (happy path, validation, every state transition legal and illegal, scope for each role, and portal isolation where relevant).
3. Frontend: page with `page-ready`, loading/empty/error states, forms with Zod, `<Can>` on actions, and toasts.
4. Add the module's routes to the route sweep. It must pass.
5. Run the master §8.2 manual checklist in the built-in browser and tick it with screenshots.
6. Write the module section of `SPEC_COMPLIANCE.md`.

**Module-specific reminders the last pass skipped:**
- **M1:** the "Forgot password?" link must work end to end (console email provider in dev, with the link printed only to the server log). Invite flow, change password, session list and revoke, settings tabs, and the audit-log viewer.
- **M7/M10:** `internal_only` comments must be **absent from the JSON** returned to portal users. The test must assert on the response body, not the UI.
- **M10:** SLA due times in IST, skipping weekly offs and holidays, with unit tests.
- **M11:** after approve and cancel cycles, the leave balance equals the ledger sum (property-style test with randomised sequences).
- **M12:** a presigned download only after the scope check. A portal user can't fetch another client's file id (test).
- **M15:** the portal role matrix is enforced in the API (`client_finance` can't read projects, `client_manager` can't read invoices). Test each one.

**GATE D:** one gate per module (evidence per R11) → approval before the next module.

---

## 6. Stage E: The Test Suites the Report Claimed but Didn't Build

1. `tests/test_rbac_matrix.py`: **parametrised** from `ROLE_MATRIX` plus the portal roles × every endpoint in `/openapi.json` × the methods it supports. The expected allow or deny comes from the matrix. Print the count of generated cases, which should be in the hundreds, not dozens.
2. `tests/test_portal_isolation.py`: clients A and B. For **every** endpoint reachable by portal roles, request B's resource ids as A and expect 403 or 404 with no B data in the body.
3. `tests/test_state_machines.py`: leads, proposals, projects, tasks, invoices, tickets, agreements and leave, covering every legal and illegal transition.
4. Coverage: `pytest --cov=app/api --cov=app/policies --cov-report=term-missing`, with a target of **≥ 85 %**. Paste the table.
5. **Vitest + Testing Library:** formatters (₹ en-IN, IST dates), `<Can>`, status badge mapping, and form validation messages for the invoice, lead and leave forms.
6. **Playwright golden journeys** (master §8.3, all five), each as its own spec file, run against a fresh seeded Postgres test DB with real UI clicks (no API shortcuts except for setup data).
7. **CI** in `.github/workflows/ci.yml`: a Postgres 16 service container, then alembic upgrade, ruff, `ruff format --check`, mypy, pytest with coverage, eslint, tsc, vitest, next build, and Playwright (route sweep plus journeys) with screenshots uploaded as artifacts on failure. Paste a link to a green run.

**GATE E:** suite outputs, coverage table and CI link → approval.

---

## 7. Stage F: Polish, Deploy, Compliance

1. **Accessibility and performance:** Lighthouse (desktop) and axe on dashboard, leads, invoice detail and portal home, with targets from master Gate 3. Paste the scores and the axe violation counts.
2. **Deploy** per master §10: Vercel plus the Neon `main` branch, prod-safe seed only (no real client data, no demo data), migrations run from CI, a smoke script, and `/docs` returning 404 in production. Paste the production URL and the smoke output.
3. **Rewrite README.md** with setup, the env table (names only), commands, roles and scopes, how to run the QA suites, and how to deploy. No credentials.
4. **`docs/qa/SPEC_COMPLIANCE.md`**: one row per requirement in the master prompt (every bullet in §5 Phase 1, every M1–M15 bullet, every §8.3 suite, every gate item):

| Ref | Requirement | Status (Done/Partial/Not started) | Evidence (file:line, test name, screenshot, command) | Notes |
|---|---|---|---|---|

5. **`docs/qa/EVIDENCE.md`**: from a **fresh clone** in a new folder, run the full setup and every check command, and paste the outputs. This proves the project works without the agent's local state.

**FINAL GATE:** `SPEC_COMPLIANCE.md` has no "Not started" rows and every "Partial" row is approved as deferred by the owner, `EVIDENCE.md` is complete, the production smoke test passes, and the CI run is green.

---

## 8. Session Report Format (mandatory, R11-compliant)

```md
### Session report — <date>
**Stage / gate:** …
**Claims (each with evidence):**
| Claim | Evidence type | Evidence (command + output tail / screenshot path + size / test names / URL) |
|---|---|---|
**Bugs:** BUG-0xx (Px): root cause file:line + why, fix commit, regression test
**Spec compliance delta:** rows moved to Done this session (refs)
**Not done / known gaps (be explicit):** …
**Needs owner:** …
**For the undergraduate developer — what changed and why:** (plain English, include one lesson from this session's mistakes, e.g. "a test that cannot fail proves nothing")
```

Start with **Stage A1** now.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T14:26:57+05:30.

The user's current state is as follows:
Active Document: c:\coding\digital foot crm\DCRM\docs\qa\PROGRESS.md (LANGUAGE_UNSPECIFIED)
Cursor is on line: 268
Other open documents:
- c:\coding\digital foot crm\DCRM\apps\web\package.json (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\docs\qa\BUGS.md (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\web\components\layout\portal-header.tsx (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\web\components\layout\saas-header.tsx (LANGUAGE_UNSPECIFIED)
- c:\coding\digital foot crm\DCRM\apps\web\components\layout\saas-sidebar.tsx (LANGUAGE_UNSPECIFIED)
</ADDITIONAL_METADATA>