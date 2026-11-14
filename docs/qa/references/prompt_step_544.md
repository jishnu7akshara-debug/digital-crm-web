<USER_REQUEST>
# DCRM: Gate 0 Final Close-Out (Verification, Data-Safety Audit, Automated Route Sweep)

> Paste into Antigravity, opened at `C:\coding\digital foot crm\DCRM`.
> This continues `DCRM_Completion_and_QA_Loop_Prompt.md` and `DCRM_Phase0_Closeout_and_Phase1_Prompt.md`. All rules R1–R10 and the §5 working rules still apply.
> **Scope of this session:** close Gate 0 with evidence. **Don't start Phase 1** (no ruff autofix, no ESLint setup, no refactors) until the owner writes "Gate 0 approved".

---

## 0. Review of Your Last Session Report

Good progress: `.gitattributes`, `check_env.py`, the ruff breakdown, and the empirical proof of B-16 are all solid work. However, the review found **five problems that must be resolved before Gate 0 can close**. Two of them are higher priority than the route sweep.

| # | Severity | Finding | Why it matters |
|---|---|---|---|
| G0-1 | **P0** | **`pytest` was run against the live dev database.** Your own report says the test branch isn't separated yet, and `test_lead_conversion_idempotence` *creates* clients, contacts and audit rows. The dev DB now likely contains test-generated rows mixed with seeded data. | This is exactly the data contamination that Gate 0 was meant to prevent. Every later baseline (route sweep, dashboard numbers) would be measured on polluted data. |
| G0-2 | **P1** | **`check_env` reported "ALL CHECKS PASSED (exit 0)" while `TEST_DATABASE_URL` was missing or the same as dev.** A check that passes in an unsafe configuration is a broken check. | `pytest` must be *impossible* to run against dev. Right now nothing stops it. |
| G0-3 | **P1** | **The runtime claim is inconsistent.** B-18 says Smart App Control blocks `psycopg-binary` and `_argon2_cffi_bindings`, yet `check_env` connected over psycopg and four login tests (which need argon2) passed. Either SAC isn't actually blocking, or the run happened in some other environment. The report doesn't say which. | "Evidence over claims." We can't choose WSL2 vs SAC correctly if we don't know what actually ran. Also, the B-18 note "or pure-Python driver" is misleading: psycopg's pure-Python mode still needs a native `libpq` DLL on Windows, and argon2 has no pure-Python implementation. |
| G0-4 | **P1** | **B-21 was fixed for two columns only.** If the initial migration missed `contracts.signed_copy_received` and `sent_date`, other model-to-migration drift is likely. Nobody has run a full drift check. | Hidden drift causes "works locally, fails on Neon prod" later. |
| G0-5 | **P2** | **Several items are still unverified:** `mypy`, `pnpm tsc --noEmit`, `pnpm build` and `pnpm lint` outputs aren't in this report, the route sweep hasn't started, the ruff count went from 720 to 728 (new code added errors), and "seeded the real clients from the agency reference PDF" means **real client data** may now be in dev and in the repo. | New code must be lint-clean from the day it's written. Real client data needs a handling rule before anything is pushed or deployed. |

Also: the report says "12 of 14 boxes". Report against **the gate list as written** in the Phase 0 close-out prompt, box by box, not a re-counted version.

---

## 1. Owner Actions (Ji does these, you wait)

Write these into `docs/qa/PROGRESS.md → Owner actions`. Don't attempt them yourself.

- [ ] Neon console → create branch **`test`** from **`dev`** (or from `main` if it's empty). Copy the **direct** (non-pooler) connection string into `apps/api/.env` as `TEST_DATABASE_URL`.
- [ ] Decide the runtime **after reading your §2.1 evidence**: if Windows works with SAC as it is, stay on Windows. If it doesn't, choose WSL2.
- [ ] Decide the **real client data policy** (§2.5): (a) keep it in dev only, or (b) replace it with fictional data.
- [ ] Reply "Gate 0 approved" only after reviewing the final session report from §5.

---

## 2. Remediation Tasks (in this order)

### 2.1 Runtime truth (resolves G0-3), read-only investigation
Run these in **the exact shell where pytest ran** and paste the raw output into `AUDIT.md → Runtime evidence`:
```bash
python -c "import sys, platform; print(sys.executable); print(platform.platform()); print(sys.version)"
python -c "import psycopg; print('psycopg', psycopg.__version__, psycopg.pq.__impl__)"
python -c "import argon2, _argon2_cffi_bindings; print('argon2 ok', argon2.__version__)"
python -c "import mypy.api; print('mypy import ok')"
```
On Windows, also run in PowerShell:
`Get-MpComputerStatus | Select-Object SmartAppControlState`. If that property isn't present on this build, fall back to `Get-CimInstance -Namespace root\Microsoft\Windows\CI -ClassName Win32_DeviceGuard` or note "not determinable".

Then **rewrite B-18** in `BUGS.md` based on the facts:
- If all imports work on Windows, SAC isn't currently blocking these wheels. Downgrade B-18 to P3 ("intermittent / reputation-based, monitor") and record which wheel versions worked.
- If some fail, list exactly which ones, with the error text (for example `ImportError: DLL load failed… An Application Control policy has blocked this file`), and keep the WSL2 recommendation.
- Remove the "pure-Python driver" option from the B-18 text, or correct it as described in G0-3.

**Acceptance criteria:** `AUDIT.md` states in one sentence which OS/interpreter produced every result in the earlier reports, backed by the pasted output.

### 2.2 Harden `check_env` (resolves G0-2)
Change `apps/api/scripts/check_env.py`:
1. Add a `--for {app,tests,migrate}` mode flag:
   - `app`: `DATABASE_URL` must be set, pooled and reachable.
   - `migrate`: `DATABASE_DIRECT_URL` must be set, direct and reachable.
   - `tests`: `TEST_DATABASE_URL` **must** be set, direct and reachable, **and must not be the same database as `DATABASE_URL` or `DATABASE_DIRECT_URL`**.
2. **How to compare "same database" without printing secrets:** parse each URL with `sqlalchemy.engine.make_url`. Compare the tuple `(host with "-pooler" removed, port, database)`. Also, after connecting, compare `SELECT current_database(), inet_server_addr()` and the Neon branch identity (`SHOW neon.timeline_id` if available; otherwise skip that part silently). Print only `SAME` or `DIFFERENT`, never the hosts.
3. Same-database in `tests` mode is an **error**: exit code 2 with the message `TEST_DATABASE_URL points at the dev database — refusing. Create a Neon 'test' branch.`
4. Default mode with no flag runs all three, and the exit code is non-zero if any fails.
5. Add `tests/test_check_env.py` with unit tests on the URL comparison function only (no real DB): pooled vs direct same host gives SAME, different branch host gives DIFFERENT, a missing variable gives an error.
6. **Pytest guard:** add a temporary `tests/conftest.py` guard now (the full harness comes in Phase 1.1). At session start, call the comparison function and `pytest.exit("Refusing to run tests against dev DB", returncode=2)` if `TEST_DATABASE_URL` is missing or SAME. Also make it override `DATABASE_URL` with `TEST_DATABASE_URL` **before** `app.main` is imported. This is the minimum safety net, and it's explicitly allowed in Phase 0.

**Acceptance criteria:** with the test variable removed, `pytest` exits immediately with the refusal message. With it set to the dev URL, it refuses. With the real test branch, it proceeds. Paste all three outputs.

### 2.3 Dev data contamination audit and cleanup (resolves G0-1)
**First diagnose, then clean.** Don't delete anything until the owner confirms the plan.
1. Write `apps/api/scripts/audit_test_pollution.py`, which is **read-only**. For every table, report row counts and rows created during the pytest run window. Get the window from `created_at` timestamps: the earliest and latest pytest run times, taken from `.pytest_cache/v/cache/lastfailed` modification time, shell history, or the session log. If unknown, list rows created on 2026-11-14 that aren't produced by `seed.py` or `seed_pdf_data.py`.
2. Identify them specifically: clients or contacts created by lead conversion, invoices created by `test_invoice_gst_calculation`, sessions from test logins, and audit_log rows from test writes.
3. Put a table in `AUDIT.md → Dev DB contamination` with columns table, suspicious rows (ids only), how identified, and proposed action.
4. **Proposed cleanup, choosing the cleanest option:**
   - **Option A (preferred):** recreate the dev branch from scratch with a Neon branch reset or a new `dev` branch, then `alembic upgrade head` and a fresh seed. That's deterministic and needs no hand-written DELETEs.
   - **Option B:** a targeted soft-delete script for the identified ids, in one transaction, with a dry-run flag that is on by default.
5. Wait for the owner to choose. Then execute it and re-run the audit script to show 0 suspicious rows. Paste the before and after.

**Acceptance criteria:** the dev DB contains only migration and seed data, proven by audit-script output, and `user_sessions` contains no test-login sessions.

### 2.4 Full migration drift check (resolves G0-4)
1. Against a **fresh empty schema on the test branch**, run `alembic upgrade head`, then `alembic check`. That command compares the models to the migrated DB and fails on any difference. Paste the output.
2. If `alembic check` reports differences, list every one in `BUGS.md` as B-21a, B-21b… with the model file:line and what's missing in the migration (column, index, constraint, nullability, server default, type).
3. Pay particular attention to **Postgres-specific risks** in `f30c91f1e3a3_initial_schema.py` and fix them through one new migration:
   - `DateTime` columns without `timezone=True` (attendance punches need timezone-aware IST → UTC storage)
   - `Boolean` server defaults written as `'0'`/`'1'`, which must be `sa.false()`/`sa.true()`
   - Missing `ondelete` on foreign keys that the models expect
   - Missing indexes on foreign keys and on `is_deleted`, `status`, `client_id` and `created_at` (used by every list query)
   - Unique constraints declared in models but not in migrations (for example `clients.code` and `service_catalogue.code`)
4. Check B-21 itself: confirm that migration `330814f38817` has a working `downgrade()`. Run `alembic downgrade -1 && alembic upgrade head` on the test branch and paste the output.
5. Run `alembic heads` and confirm there's **exactly one head**.

**Acceptance criteria:** `alembic check` reports "No new upgrade operations detected", there's one head, and downgrade then upgrade round-trips cleanly.

### 2.5 Real client data handling (part of G0-5)
1. Inspect `seed_pdf_data.py` and list the **categories** of real data it inserts (company names, contact person names, phone numbers, emails, GSTINs, addresses, amounts) in `AUDIT.md`. **Don't copy any values into docs.**
2. Check whether the repo has a remote (`git remote -v`) and whether that remote is public. Report yes/no only.
3. Depending on the owner's §1 choice:
   - **(a) Dev-only real data:** move the script to `apps/api/scripts/dev_only/seed_real_reference.py` with a hard guard that refuses unless `APP_ENV=development` and the DB isn't the Neon `main` branch. Move the source data into a git-ignored file (`apps/api/data/reference_clients.local.json`) and load it from there. Remove the hardcoded values from tracked code. Add a `*.local.json` rule to `.gitignore`.
   - **(b) Fictional data:** replace it with clearly fictional names (for example "Sample Interiors Pvt Ltd") and invalid-format GSTINs/phones (for example the `+91 00000 0xxxx` pattern) so they can never be mistaken for real records.
4. If real values were **already committed** and a remote exists, flag it to the owner as P1 and **don't** rewrite git history yourself. That's the owner's decision, and the options are a fresh repo or `git filter-repo`.

**Acceptance criteria:** `git grep` for three sample real values (pick them locally, don't print them) returns nothing in tracked files, and the guarded script refuses on a non-development environment (paste the refusal).

### 2.6 Complete the command baseline (part of G0-5)
Run on the chosen runtime and paste the **last 15 lines plus a one-line summary** for each:
```
python -m scripts.check_env                 # all modes
pytest -v                                   # now against the TEST branch only — expect B-16 failure, nothing else
mypy app                                    # summary: total errors + top 10 error codes with counts
python -m ruff check . --statistics          # explain 720 → 728: list which new files introduced the 8 new errors
python -m ruff format --check .
pnpm tsc --noEmit
pnpm build
pnpm lint                                    # expected to fail on F-15; record the failure only
```
**New code must be clean now:** `check_env.py`, `audit_test_pollution.py`, the conftest guard and the new migration must have **zero** ruff errors on their own (`ruff check <those files>`). That isn't the mass cleanup; it's not adding new debt. The Phase 1 mass cleanup is still deferred.

---

## 3. Automated Baseline Route Sweep (the remaining Gate 0 item)

Doing roughly 30 routes × 3 roles by hand is slow and can't be repeated. **Build a sweep script once.** It becomes the regression harness for Phase 4.

### 3.1 QA users (dev and test only)
Create `apps/api/scripts/dev_only/create_qa_users.py`:
- Refuses unless `APP_ENV=development`.
- Creates (idempotently) `qa.sales@example.test` with the `sales` role and a linked Employee record if that model requires one, and `qa.client@example.test` as a portal user with the `client_owner` role, linked as a `ClientContact` of one seeded client.
- Reads the password from the `QA_USER_PASSWORD` env variable. It never hardcodes, prints or writes it to docs.
- The super admin uses the existing seeded account, with its password from env.

### 3.2 Playwright sweep script
In `apps/web`, add `@playwright/test` as a dev dependency, run `pnpm exec playwright install chromium`, and create `apps/web/e2e/baseline-sweep.spec.ts` plus `playwright.config.ts` (baseURL `http://localhost:3000`, Chromium only, viewport 1440×900, `workers: 1`, `retries: 0`).

**Behaviour:**
1. For each role (`super_admin`, `sales`, `client_owner`), log in through the **real login UI** of the correct portal (`/internal/login` or `/portal/login`). Credentials come from env variables `QA_ADMIN_EMAIL`/`QA_ADMIN_PASSWORD` and so on, never from the source.
2. Route lists:
   - Internal: everything in master §8.1, with `[id]` routes resolved by first calling the list API (`/api/v1/leads?page_size=1` and so on) and taking the first id. If a list is empty, record `SKIPPED: no data`.
   - Portal: all `/portal/*` routes.
   - Negative checks: `sales` opening `/internal/settings/roles`, `client_owner` opening `/internal/dashboard`, any role opening `/this-route-does-not-exist`, and an anonymous context opening `/internal/leads`.
3. For each route, attach listeners **before** navigation:
   - `page.on('console')` collects `error` and `warning` messages
   - `page.on('pageerror')` collects uncaught exceptions
   - `page.on('requestfinished' / 'requestfailed')` captures every `/api/v1/*` call: method, path (strip query values that look like ids or emails), status, and duration in ms
4. Navigate, then `waitForLoadState('networkidle')` with a 15 s timeout, record the final URL (to detect redirects), and take a full-page screenshot to `docs/qa/screens/baseline/<route-slug>__<role>.png`.
5. **Hardcoded-data heuristic (automatic first pass):**
   - The page made **no** `/api/v1` data calls but rendered table rows or cards → `HARDCODED (suspected)`
   - It made API calls but some returned 4xx/5xx while rows still rendered → `FALLBACK MASKING ERROR (suspected)`, which is the F-06 pattern
   - Its API calls returned 200 and the visible row count matches the API `total` or `items.length` → `API`
   - Anything else → `MIXED / REVIEW`
   - Then **cross-check each suspected verdict against the source**: grep the page file for `DEFAULT_|INITIAL_|_DATA = \[` and confirm or override. Write the final verdict with the constant name and line.
6. Write results to `docs/qa/baseline-sweep.json` (machine-readable, for later diffing) and generate `docs/qa/BASELINE_SWEEP.md` with this table:

| Route | Role | Final URL | HTTP ok? | Data source verdict | API calls (method path → status, ms) | Console errors | Page errors | Screenshot | Backlog ref |
|---|---|---|---|---|---|---|---|---|---|

7. Add a **summary** block at the top: totals per verdict, the 10 slowest API calls, every 5xx, every route with a page error, and every expectation mismatch in the negative checks (for example `sales` reached the roles page → **P0 authorization bug**, logged in `BUGS.md` right away).
8. Add the script `"qa:sweep": "playwright test e2e/baseline-sweep.spec.ts"` to `package.json`.

### 3.3 Run it
1. Start the backend on the **dev** DB (clean, after §2.3) and the frontend with `pnpm dev`.
2. Run `pnpm qa:sweep` **twice**. The second run shows the results are stable. Any route whose verdict differs between runs gets flagged as `FLAKY` with the reason.
3. Do one manual pass of the three negative cases in the built-in browser to confirm the script's verdicts with your own eyes. Add one sentence per case.
4. Also capture the **API-down** state once: stop uvicorn, run the sweep for `super_admin` on leads, clients, invoices and projects only, and record what each page shows. Today these will likely show fake `DEFAULT_*` rows, which is concrete proof of F-06.

**Acceptance criteria:** `BASELINE_SWEEP.md` covers 100 % of routes × roles (or explicit `SKIPPED` with a reason), screenshots exist for every row, every P0/P1 the sweep found is in `BUGS.md` with a root cause, and the run-to-run diff is empty or explained.

---

## 4. Gate 0 Checklist (report against exactly these items)

- [ ] §1 owner actions confirmed (test branch exists, runtime chosen, data policy chosen)
- [ ] §2.1 runtime evidence pasted, B-18 rewritten from facts
- [ ] §2.2 `check_env` modes plus the pytest guard, with the three refusal/pass outputs pasted
- [ ] §2.3 contamination audit before and after, with dev DB clean
- [ ] §2.4 `alembic check` clean, one head, downgrade/upgrade round-trip
- [ ] §2.5 real-data policy applied, with `git grep` and the guard evidence
- [ ] §2.6 all eight commands' outputs pasted, the 720→728 delta explained, and new files ruff-clean
- [ ] §3 sweep complete for 3 roles plus negative checks plus API-down, run twice, summary written
- [ ] `BUGS.md` updated: every finding has a severity, root cause (file:line plus why) and planned phase
- [ ] "What changed and why" note covering: why tests must never touch dev data (with what happened today as the example), what migration drift is and how `alembic check` catches it, why real client data needs special handling, and how the automated sweep works and why it's better than clicking around

---

## 5. Then Stop

Post the session report in the standard format (Phase 0 close-out prompt §6). Add a **"Recommended Phase 1 adjustments"** section listing anything the sweep revealed that should change the Phase 1 order. For example, if the sweep finds a P0 authorization hole, Phase 1.5 (scope engine) should move ahead of 1.0 (tooling). Then **wait for "Gate 0 approved"**. Don't start Phase 1.

### Hard rules for this session
- Never print, log, commit or ask for secrets or real client values. Use variable names and ids only.
- Never run `pytest` until the §2.2 guard exists and passes.
- Never delete dev data before the owner chooses Option A or B in §2.3.
- Every claim of "passed" or "fixed" comes with the command and its output tail, or a commit hash plus test name.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T12:08:59+05:30.

The user's current state is as follows:
Active Document: c:\coding\digital foot crm\DCRM\docs\qa\PROGRESS.md (LANGUAGE_UNSPECIFIED)
Cursor is on line: 1
Other open documents:
- c:\coding\digital foot crm\DCRM\docs\qa\AUDIT.md (LANGUAGE_UNSPECIFIED)
</ADDITIONAL_METADATA>