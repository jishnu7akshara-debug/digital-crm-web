<USER_REQUEST>
# DCRM: Phase 0 Close-Out + Phase 1 Foundations (Execution Prompt for Antigravity)

> Paste this whole file into Antigravity, opened at `C:\coding\digital foot crm\DCRM`.
> It **continues** `DCRM_Completion_and_QA_Loop_Prompt.md`. That master prompt and its rules R1–R10 still apply in full.
> Where this file is more specific, this file wins.

---

## 0. Review of Your Phase 0 Session Report

Your report was reviewed against Gate 0. Good work on the static audit, but **Gate 0 is NOT passed yet**. Here is exactly what's missing and why it matters.

| Gate 0 item | Status | Gap |
|---|---|---|
| Tracking files created | ✅ Done | — |
| Backlog B-01…B-17, F-01…F-14 confirmed with file:line | ✅ Done | — |
| New findings logged with IDs | ✅ Done (B-18…B-20, F-15, F-16) | Severity is missing on each. Add it. |
| App runs locally against Neon `dev`, seed succeeds | ❌ Not done | Blocked on DB and on Smart App Control |
| **Baseline route sweep (§4 step 6)**: every route in the browser, real vs fake data, console/network errors, screenshots | ❌ Not done | The most important Phase 0 output is missing. A static code read isn't a baseline. |
| `pytest`, `mypy`, `pnpm lint` raw outputs | ❌ Not run | Blocked on SAC (pytest, mypy) and F-15 (lint) |
| `ruff check` output | ⚠️ Run, 720 errors | Needs a categorised breakdown, not just a count (see §3) |
| "What changed and why" note | ✅ Done | — |

**Corrections to your proposed next steps:**
1. **Never ask for database URLs in chat.** Credentials must never pass through the agent conversation or appear in logs, commits or `docs/qa/*`. The owner pastes them into `apps/api/.env` (git-ignored) themselves. Your job is to provide the template and a verification script that reports only *whether* each variable is set and reachable, never its value.
2. **Don't make "turn off Smart App Control" the default fix.** It weakens the machine's security for a dev convenience, and on many Windows 11 builds, once you turn it off you can't turn it back on without resetting Windows. The preferred path is **WSL2 (Ubuntu)** for the Python backend (§2). Turning SAC off is the owner's decision to make knowingly, not a step you recommend first.
3. **Don't mass-fix the 720 ruff errors in Phase 0.** Phase 0 is read-only for feature code. Ruff cleanup happens in Phase 1.0 (§4) as an isolated, mechanical commit, so the diff can be reviewed separately from logic changes.

---

## 1. What the Owner (Ji) Does Before You Continue

These are human steps. Write them into `docs/qa/PROGRESS.md` under "Owner actions" as a checklist, and **wait** until the owner confirms they're done. Don't attempt them yourself.

- [ ] **Choose the backend runtime:** WSL2 (recommended) **or** turn off SAC (owner's informed choice).
- [ ] **Neon:** create the project `digital-footprint-os` with three branches: `main` (prod, leave empty for now), `dev`, and `test`.
- [ ] Copy `apps/api/.env.example` → `apps/api/.env` and paste in:
  - `DATABASE_URL`: the `dev` branch **pooled** connection string (host contains `-pooler`), with the prefix changed to `postgresql+psycopg://` and `?sslmode=require` kept
  - `DATABASE_DIRECT_URL`: the `dev` branch **direct** connection string (no `-pooler`)
  - `TEST_DATABASE_URL`: the `test` branch **direct** connection string
- [ ] Confirm `.env` is listed by `git check-ignore apps/api/.env` (it should print the path).

---

## 2. Phase 0.5: Environment That Actually Runs

### 2.1 Option A: WSL2 (recommended)
**Why:** Linux wheels for `argon2-cffi-bindings`, `psycopg[binary]` and `mypy` aren't affected by Windows Smart App Control, and Vercel runs Linux, so the local environment matches production.

1. Give the owner these commands to run once in an **admin PowerShell**: `wsl --install -d Ubuntu`, then reboot, then create the Linux user.
2. Inside Ubuntu:
   ```bash
   sudo apt update && sudo apt install -y build-essential curl git
   curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.bashrc
   cd /mnt/c/coding/digital\ foot\ crm/DCRM/apps/api
   rm -rf .venv            # the Windows venv cannot be reused in Linux
   uv venv --python 3.12 && source .venv/bin/activate
   uv pip install -e ".[dev]"
   ```
3. **Performance note:** `/mnt/c` file access from WSL is slow. If `pytest` or `uvicorn --reload` takes more than about 10 s to start, clone the repo into `~/code/DCRM` inside WSL and work there. Record which location you chose in `PROGRESS.md`.
4. The frontend can stay on Windows (`pnpm dev`). The Next.js rewrite to `http://127.0.0.1:8000` reaches WSL2 through localhost forwarding. Verify it with `curl http://127.0.0.1:8000/api/v1/health` from **Windows** PowerShell.
5. Add a `.gitattributes` with `* text=auto eol=lf` so Windows/WSL line endings don't produce noise diffs. Commit that alone.

### 2.2 Option B: SAC turned off by the owner
If the owner chooses this, delete and recreate the Windows `.venv` and reinstall. Record the decision and the date in `PROGRESS.md` and continue. Don't ask again.

### 2.3 Environment verification script (new file)
Create `apps/api/scripts/check_env.py`. Run it with `python -m scripts.check_env`. It must:
- Load `.env`, then print a table of each required variable → `SET` / `MISSING` (**never print values**, not even partially masked hosts).
- For `DATABASE_URL`, `DATABASE_DIRECT_URL` and `TEST_DATABASE_URL`: open a connection, run `SELECT version(), current_database()`, and print only `OK (PostgreSQL 16.x, db=<name>)` or the exception class plus a one-line hint (for example `OperationalError: check sslmode=require / pooled vs direct host`).
- Assert that `DATABASE_URL` host contains `-pooler` and that `DATABASE_DIRECT_URL` and `TEST_DATABASE_URL` don't. Warn if `dev` and `test` point to the same database, which would let tests wipe dev data.
- Exit code 0 only if all checks pass.

### 2.4 Migrate, seed, run
```bash
python -m scripts.check_env                 # must exit 0
alembic upgrade head                        # uses DATABASE_DIRECT_URL (fix env.py now if it doesn't — this is allowed in 0.5)
alembic current                             # paste output
python seed.py                              # paste the summary counts, not credentials
uvicorn app.main:app --reload --port 8000
```
**Diagnosis gate:** if `alembic upgrade head` fails on Postgres, the initial migration was probably generated against SQLite. Before changing anything, write down the failing statement, the line in `f30c91f1e3a3_initial_schema.py`, and the SQLite-vs-Postgres reason (common ones: `Boolean` server defaults written as `0/1`, `String` without length used as an enum, `DateTime` without `timezone=True`, `batch_alter_table` leftovers). Fix it in a **new** migration only if the initial one is already applied anywhere. If the DB is brand-new, editing the initial migration is acceptable, but log why in `BUGS.md`.

**Acceptance criteria (0.5):**
- `check_env` exits 0, `alembic current` shows head, and the seed prints its counts
- `GET /api/v1/health` returns 200 from Windows
- Login as super admin succeeds through the Next.js UI at `http://localhost:3000/internal/login`

---

## 3. Phase 0.6: Finish the Baseline (the part that was skipped)

### 3.1 Route sweep (mandatory, browser-based)
Use the browser tool to visit **every route** in master §8.1 as super admin, then repeat the internal set as a `sales` user and the portal set as a `client_owner` user. Create those two test users through the seed or the roles API if they don't exist, with passwords generated locally and **not** written into docs.

For each route, record one row in `AUDIT.md` → "Baseline Route Sweep":

| Route | Role | Loads? | Data source (API / hardcoded / mixed) | API calls made (method path → status) | Console errors | Visual issues | Screenshot |
|---|---|---|---|---|---|---|---|

Rules:
- Capture the **network log**, not only the console. A page can render while a call returns 500, because the hidden `DEFAULT_*` fallbacks mask it.
- For every "hardcoded" or "mixed" verdict, cite the constant name and line, and cross-reference the backlog ID (F-01…F-08).
- Screenshots go in `docs/qa/screens/baseline/<route-slug>__<role>.png`.
- Also check the 404 page, a forced 403 (sales user opening `/internal/settings/roles`), and an API-down state (stop uvicorn and load `/internal/leads`).

### 3.2 Full command baseline (raw outputs)
Run and paste the **raw output tail plus a summary line** for each:
```
pytest -v                       # expect failures — record which and why (seed-state dependence = B-16)
mypy app                        # count by error code
ruff check . --statistics       # breakdown by rule code, not just total
ruff format --check .
pnpm tsc --noEmit
pnpm build
pnpm lint                       # will fail until F-15 is fixed — record the failure, fix in Phase 1.0
```

### 3.3 Classify the 720 ruff errors
In `AUDIT.md`, add a table built from `ruff check --statistics`:

| Rule | Count | Category | Auto-fixable? | Risk |
|---|---|---|---|---|
| I001 | … | import sorting | yes | none |
| UP006/UP035 | … | `List`→`list` modernisation | yes | none |
| E712 | … | `== False` comparisons | **unsafe-fix** | ⚠️ SQLAlchemy needs `== False` or `.is_(False)`, and a naive fix to `not x` **breaks queries** |
| F401 | … | unused imports | yes | low |
| B008 | … | `Depends()` in defaults | n/a | false positive for FastAPI, so configure an ignore |
| … | | | | |

That E712 row is critical. Ruff's suggested fix for `Model.is_deleted == False` produces `not Model.is_deleted`, which Python evaluates **before** SQLAlchemy sees it, so it **silently returns wrong rows**. It must be rewritten to `Model.is_deleted.is_(False)`, never to `not ...`.

### 3.4 Severity on new findings
Assign a severity to each new finding: B-18 (P1, blocks dev env), B-19 (P3), B-20 (P2, wrong data shown), F-15 (P2, blocks the lint gate), F-16 (P2, merge into F-11). Add any others the sweep reveals.

### GATE 0 (final)
- [ ] Owner actions in §1 confirmed
- [ ] §2.4 acceptance criteria met, with outputs pasted
- [ ] Route sweep table complete for all routes × 3 roles, with screenshots present
- [ ] All seven commands' raw outputs pasted, and the ruff breakdown classified
- [ ] Every finding has a severity, and `BUGS.md` holds every P0/P1 found in the sweep
- [ ] "What changed and why" note (topics: what WSL is and why dev should match prod; pooled vs direct DB connections; why secrets never go in chat or git)

**Stop here and post a session report. Don't start Phase 1 until the owner replies "Gate 0 approved".**

---

## 4. Phase 1: Foundations (execute after approval)

Order matters. Each sub-phase is **its own commit or commits**, with tests passing after each one.

### 1.0 Tooling hygiene (mechanical only, no behaviour change)
1. **Ruff config** in `pyproject.toml`:
   ```toml
   [tool.ruff.lint]
   select = ["E", "F", "I", "UP", "B", "SIM", "N", "S", "DTZ", "RUF"]
   ignore = ["B008"]            # FastAPI Depends() in defaults is intentional
   [tool.ruff.lint.per-file-ignores]
   "tests/**" = ["S101"]        # assert is fine in tests
   "alembic/versions/**" = ["E501", "I001"]
   ```
2. Run `ruff check . --fix` (**safe fixes only, never `--unsafe-fixes`**), then `ruff format .`. Commit as `chore(api): ruff safe autofix + format`, with no other changes in that commit.
3. Fix **E712 by hand**: replace `col == False` with `col.is_(False)` and `col == True` with `col.is_(True)`. Add a test that lists soft-deleted vs active rows before and after the change to prove the query results are identical. Commit `fix(api): sqlalchemy boolean comparisons`.
4. Fix the remaining ruff errors by category. Any **DTZ** errors (naive datetimes) get logged as bugs, not just silenced, because naive datetimes break the IST attendance rules.
5. **F-15 ESLint:** add `eslint`, `eslint-config-next` and `@eslint/eslintrc`, create `eslint.config.mjs` (flat config extending `next/core-web-vitals` and `next/typescript`), and change the script to `"lint": "eslint ."`. That avoids the interactive `next lint` prompt, which is deprecated in recent Next.js versions. Commit separately.
6. **B-19:** update the test client usage to the current `httpx`/Starlette API so the deprecation warnings are gone. Run `pytest -W error::DeprecationWarning` to prove it.
7. **B-17:** `git rm --cached` any tracked `*.db` files. Confirm `git ls-files | grep -E "\.db$|\.venv|\.next|node_modules"` is empty.

**AC 1.0:** `ruff check .` = 0, `ruff format --check .` clean, `pnpm lint` = 0 errors, `pytest` result **unchanged versus baseline** (proving no behaviour change), and no tracked build or DB artefacts.

### 1.1 Isolated test harness (do this BEFORE fixing logic, so every fix gets a test)
**Root cause of B-16:** the tests import the app bound to the dev `DATABASE_URL` and assert on seed values (`94400.0`).
- `tests/conftest.py`:
  - Override settings so `DATABASE_URL = TEST_DATABASE_URL`, and **refuse to run** if `TEST_DATABASE_URL` is missing or equals `DATABASE_URL`.
  - At session start, drop and recreate the schema via `alembic upgrade head`, not `create_all`, so migrations themselves get tested.
  - Per test, open a connection, begin an outer transaction, bind a session with `join_transaction_mode="create_savepoint"`, override the `get_db` dependency, and roll back after the test.
  - Factories in `tests/factories.py`: `make_org`, `make_user(role, user_type="internal")`, `make_client`, `make_contact(user=)`, `make_service`, `make_lead(owner=)`, `make_project(members=)`, `make_invoice(lines=)`.
  - Fixture `login_as(user)` → an authenticated `TestClient`.
- Rewrite `test_auth.py` and `test_crm_finance.py` to use factories, so they no longer depend on `seed.py`.

**AC 1.1:** `pytest` passes twice in a row, and the dev DB row counts are identical before and after the test run (prove it with a count query).

### 1.2 Config safety (B-14), from master §5 1.1
Validator fails startup in production when `SECRET_KEY` is the default or under 64 characters, when `SECURE_COOKIES` is false, or when the DB is SQLite. Also set `SQLITE_FALLBACK` to default `False` and remove the SQLite default `DATABASE_URL` (a missing `DATABASE_URL` should raise a clear error). Remove the seeded password from `README.md`.
**Tests:** `test_config.py` with 4 cases (prod+defaults fails, prod+valid passes, dev+defaults passes with a warning, missing DB URL fails).

### 1.3 Serverless DB engine (B-15)
`NullPool` when `os.getenv("VERCEL")`, a small `QueuePool` otherwise, and `pool_pre_ping=True` everywhere. `alembic/env.py` uses `DATABASE_DIRECT_URL` only.
**Test:** a unit test that asserts the pool class under both env conditions.

### 1.4 Atomic audit + transaction helper (B-13)
- `log_audit_event()` does `db.add()` only, with no commit.
- Add `app/core/tx.py` with a `transactional(db)` context manager (commit on exit, rollback and re-raise on exception).
- Refactor **every** write endpoint (grep for `db.commit()` in `app/api/v1`) to a single commit through the helper. List each changed endpoint in the commit message.
**Test:** `test_audit_atomicity.py` monkeypatches a failure after the business write and asserts that neither the row nor the audit entry exists. Then, for 5 representative write endpoints, it asserts exactly one audit row per successful call.

### 1.5 One scope engine (B-12)
Implement `app/policies/scoping.py` from master §5 1.4, plus `assert_can_access(obj, scope)`.
- Wire it into the **list and detail endpoints of the existing routers first**: leads, clients, projects, invoices, support, agreements and attendance. New routers in Phase 2 use it from day one.
- `department` scope resolves through `Employee.department_id` of the caller. If the caller has no employee record, `department` falls back to `own` and logs a warning.
- Portal users are **always** forced to `client` scope regardless of role config.
- **B-20:** while in `leads.py`, remove the `"Meera Sharma"` fallback and return `owner: null`. The UI shows "Unassigned".
**Tests:** `test_scoping.py` creates users X and Y, plus two departments and two clients, and asserts exact visible row counts per scope for leads, projects, invoices and tickets. `test_portal_isolation.py` (first version) covers invoices, projects, tickets and agreements across clients A and B, where every cross-client request returns 403 or 404.

### 1.6 Login hardening (B-14)
DB-backed rate limit: a `login_attempts` table (email_hash, ip, created_at) with a migration. 5 failures per 15 minutes per email+IP returns 429 with a `Retry-After` header. Generic error message for unknown users and wrong passwords. Session token rotated on login. Cookie flags set per environment.
**Tests:** the 6th attempt returns 429, a success resets the counter, and the unknown-email and bad-password responses are byte-identical.

### 1.7 Frontend foundations
In this order, one commit each:
1. **F-09:** prove `sidebar.tsx`, `header.tsx` and `sf-header.tsx` have zero imports (`grep -rn` output pasted), then delete them.
2. **Toast system + replace every `alert()`** (F-11, F-16). Gate: `grep -rn "alert(" apps/web/app apps/web/components` returns nothing.
3. **State components:** `PageSkeleton`, `EmptyState`, `ErrorState(onRetry)`, and a `QueryBoundary` helper that renders exactly one of the four states.
4. **`lib/query-keys.ts`** plus invalidation after every existing mutation.
5. **Typed API:** an `openapi-typescript` script `pnpm gen:api` that reads `http://127.0.0.1:8000/openapi.json` into `lib/api-types.ts`. Replace `api.get<any>` in the files you touch. A full replacement isn't required until each module's Phase 2.
6. **Permission-aware nav** plus a `<Can permission>` component (F-12).
7. **Auth routing (F-10):** a `/login` chooser, role-aware `logout()`, and `middleware.ts` redirects based on cookie presence.
8. **Remove the `DEFAULT_*` fallbacks only where an endpoint already exists** (leads, clients, projects, invoices, agreements, `projects/[id]`, and portal invoices/projects). Replace them with `QueryBoundary`. Pages whose backend doesn't exist yet (dashboard, opportunities, team, reports, services, portal home) keep their constants **until their Phase 2 module**, but get a visible dev-only banner: "⚠ Demo data: backend pending (F-0x)". This keeps the app usable without lying about it.

**AC 1.7:** the route sweep re-run on the affected pages shows no fake rows where the API exists, a correct empty state when the test DB is empty, a correct error state when the API is stopped, and zero console errors.

### GATE 1
- [ ] Every 1.x acceptance criterion met, each with a test name or screenshot
- [ ] `ruff`, `ruff format --check`, `mypy app` (record the remaining count, which only needs to drop, not hit zero, in Phase 1), `pytest` (isolated, run twice), `pnpm lint`, `tsc` and `build` all pass. Paste the outputs.
- [ ] Route sweep re-run for leads, clients, projects, invoices, agreements and the portal, compared with the baseline in a before/after table
- [ ] `BUGS.md`: every bug found in Phase 1 has a root cause, a fix commit and a regression test
- [ ] "What changed and why" note (topics: transactions and rollback, test isolation and factories, what RBAC scope means with a worked example, why the E712 autofix is dangerous)

---

## 5. Working Rules for This Session

1. **One sub-phase at a time.** Finish it, run the full test suite, commit, then update `PROGRESS.md`. Never batch several sub-phases into one commit.
2. **Root-cause entry before every fix** (R1): symptom → file:line → why → fix → regression test.
3. **If a command fails for environment reasons**, stop and report the exact error plus the two most likely causes. Don't silently work around it by switching to SQLite, skipping tests, or using `--no-verify`.
4. **Never** print, log, commit or ask for secrets. Reference them only by variable name.
5. **Evidence over claims.** "Passed" must be followed by the command and its output tail. "Fixed" must be followed by the commit hash and test name.
6. If you discover something the master prompt didn't anticipate, add it as a new ID in `AUDIT.md` with a severity, and keep going unless it's a P0.

## 6. Session Report Format (use exactly this)

```md
### Session report — <date>
**Phase / sub-phase:** …
**Gate status:** <gate> — X of Y boxes ticked (list unticked ones)
**Done (with evidence):**
- <item> — `<command>` → <result tail> | commit <hash> | test <name>
**Bugs found / fixed:** BUG-0xx (Px) — root cause: <file:line — why> — fix <hash> — test <name>
**Blocked / needs owner:** …   (never include secret values)
**Next step:** …
**For the undergraduate developer — what changed and why:**
- …
```

Start with **§1 owner checklist → §2 environment**. If the owner has already confirmed §1, go straight to §2.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-14T11:38:38+05:30.
</ADDITIONAL_METADATA>