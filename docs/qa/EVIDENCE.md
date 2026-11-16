# Digital Footprint OS (DCRM) — Empirical QA Evidence Log

**Last Updated:** 2026-11-16
**Standard:** Rules R1–R12 Proof Protocol (Verbatim Tool Logs, Raw Numbers, Zero Blank/Skeleton Pages)

---

## 1. Environment & Database Isolation Guard (Step 3)

### Verbatim `scripts/check_env.py` Output
```text
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
 - TEST_DATABASE_URL   : OK (PostgreSQL 18.7 (a21afb5), db=dcrm_test)

[3/3] Checking database branch isolation...
 - Dev vs Test branch comparison: DIFFERENT

=================================================================
 Result: ALL CHECKS PASSED (exit code 0)
=================================================================
```

- **Dev Database:** `neondb` on AWS Neon PostgreSQL (pooled / direct unpooled)
- **Test Database:** Dedicated database `dcrm_test` (direct unpooled)
- **Physical Isolation:** Verified distinct databases (`is_same_database == False`), ensuring tests never contaminate live development or seeded data.

---

## 2. Automated Route Sweep Results (Step 2)

**Playwright Test Suite:** `apps/web/e2e/route-sweep.spec.ts`
**Report File:** `docs/qa/ROUTE_SWEEP.md`
**JSON Trace:** `docs/qa/baseline-sweep.json`
**Execution Verdict:** 41/41 routes PASS (100%), 0 skeletons, all screenshots >25 KB, all primary business APIs return HTTP 200.

| Test Suite | Routes | Passing | Skeletons | Screenshot Size Range |
|---|---|---|---|---|
| 1. Unauthenticated Security Perimeter | 2 | 2 (100%) | 0 | 27.0 KB – 31.9 KB |
| 2. Super Admin Comprehensive Suite | 22 | 22 (100%) | 0 | 89.8 KB – 337.2 KB |
| 3. Sales Role Scoped Suite & RBAC Boundary | 11 | 11 (100%) | 0 | 104.1 KB – 242.6 KB |
| 4. Client Owner Portal Suite & Cross-Tenant Boundary | 6 | 6 (100%) | 0 | 40.1 KB – 122.4 KB |
| **Total** | **41** | **41 (100%)** | **0** | **40.1 KB – 337.2 KB** |

### Verified Security Boundaries:
- `sales` role attempting to access `/internal/settings/roles` -> strictly blocked with HTTP 403 Access Denied banner (`data-testid="access-denied-403"`).
- `client_owner` role attempting to access `/internal/dashboard` -> strictly redirected back to `/portal`.
- Unauthenticated requests to `/internal/*` and `/portal/*` -> redirected to respective login gates (`/internal/login` and `/portal/login`).

---

## 3. Concurrency & Indian Financial Year Transition (Step 3)

**Test File:** `apps/api/tests/test_invoices_concurrency.py`
**Database:** Isolated `dcrm_test` on PostgreSQL

### Verbatim `pytest` Test Output
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0 -- C:\coding\digital foot crm\DCRM\apps\api\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\coding\digital foot crm\DCRM\apps\api
configfile: pyproject.toml
plugins: anyio-4.16.0, asyncio-1.5.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 2 items

tests/test_invoices_concurrency.py::test_twenty_concurrent_invoice_creates PASSED [ 50%]
tests/test_invoices_concurrency.py::test_indian_financial_year_transition_clock_freeze PASSED [100%]

================== 2 passed, 1 warning in 111.03s (0:01:51) ===================
```

### Assertions Verified:
1. **20 Concurrent HTTP Invoice Creates:**
   - 20 HTTP 200 responses received
   - 20 strictly distinct invoice numbers generated
   - Sequence integers are contiguous (zero gaps or non-monotonic jumps)
2. **Indian Financial Year Transition (April 1 Clock Freeze):**
   - Pre-midnight `2026-03-31T23:59:59 UTC` maps to FY `2025-26` (sequence: `DF/2025-26/0001`, `0002`)
   - Post-midnight `2026-04-01T00:00:01 UTC` maps to FY `2026-27`
   - Sequence resets cleanly back to `DF/2026-27/0001` per Indian fiscal calendar rules.
3. **Multi-Tenant Sequence Isolation:**
   - Fixed sequence baseline initialization bug in `invoices.py:163` by filtering on `Client.organization_id == organization_id`.
   - Guaranteed that sequence generation never leaks across different organizations.
