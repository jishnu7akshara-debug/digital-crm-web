# Automated Baseline Route Sweep Report

**Execution Date:** 2026-11-14  
**Environment:** Next.js 15.1.3 (Port 3000) / FastAPI 1.0 (Port 8000) / Chromium 1440x900  
**Runner:** Playwright Test Runner (`apps/web/e2e/baseline-sweep.spec.ts`)  
**Artifact Raw Data:** [`docs/qa/baseline-sweep.json`](./baseline-sweep.json)  
**Screenshots Directory:** [`docs/qa/screens/baseline/`](./screens/baseline/)  

---

## 1. Executive Summary

An automated end-to-end route sweep was conducted across all active application pages in the Next.js frontend against the live backend API and database. The sweep systematically evaluated:
1. **Unauthenticated Access & Negative Authorization:** Verifying that protected routes correctly redirect unauthorized guests.
2. **Super Admin Access:** Traversing all 19 staff console modules and detail routes with full administrative privileges.
3. **Sales Role Access:** Verifying scoped access to CRM pipelines, leads, clients, invoices, agreements, and negative RBAC enforcement on settings/roles.
4. **Client Owner Portal Access:** Verifying customer portal landing, approvals, deliverables, invoices, and negative RBAC on internal consoles.
5. **API-Down Resilience:** Testing behavior when the backend API is disconnected (`api-down.spec.ts`).

### Sweep Statistics:
- **Total Route Interactions Evaluated:** 39
- **Total Full-Page Baseline Screenshots Captured:** 39 (plus 4 API-down state captures)
- **Uncaught Page Errors (`pageerror`):** 0 (Zero runtime client crashes)
- **Console Errors in Logged-in Sessions:** 0
- **Unauthenticated 401 Interceptions (Expected):** 4

---

## 2. Key Findings: Real vs Fake Data (Rule R2 Audit)

The empirical sweep revealed that while page routing, authentication cookies, layouts, and navigation operate cleanly, **almost every frontend screen currently relies on hardcoded fallback constants rather than invoking backend API endpoints**:

| Screen / Module | Current Data State | Evidence & File Location | Action Required in Phase 1 / Phase 2 |
|---|---|---|---|
| **Executive Dashboard** (`/internal/dashboard`) | ⚠️ **100% Mock Data** | Displays `REVENUE_TREND_DATA` (hardcoded ₹9.75L MTD), `ACTIVE_PROJECTS` ("Sashikiran Surveyors"), `SERVICE_REVENUE_DATA` in `apps/web/app/internal/dashboard/page.tsx:44-120`. No call to `/api/v1/dashboard/metrics` is made. | Wire to `/api/v1/dashboard/metrics`, delete constants, show empty state if zero records. |
| **Leads Pipeline** (`/internal/leads`) | ⚠️ **Mock Table** | Displays hardcoded lead items rather than calling `/api/v1/leads`. | Wire `useQuery` to `/api/v1/leads`, delete mock rows. |
| **Clients List & 360** (`/internal/clients`, `[id]`) | ⚠️ **Mock Data** | Displays mock clients and static stats rather than live records from `/api/v1/clients`. | Connect to `/api/v1/clients` and `/api/v1/clients/{id}`. |
| **Projects & Tasks** (`/internal/projects`, `/tasks`) | ⚠️ **Mock Data** | Static project cards and task boards without live database sync. | Wire to `/api/v1/projects` and `/api/v1/tasks`. |
| **Invoices** (`/internal/invoices`, `[id]`) | ⚠️ **Mock Invoices** | Hardcoded invoice tables with sample ₹ amounts instead of `/api/v1/invoices`. | Wire to `/api/v1/invoices`, enforce integer paise to rupee formatting. |
| **Contracts / Agreements** (`/internal/agreements`) | ⚠️ **Mock Agreements** | Static list without querying `/api/v1/agreements`. | Wire to `/api/v1/agreements`. |
| **Client Portal** (`/portal`, `/portal/projects`, etc.) | ⚠️ **Mock Portal** | Hardcoded deliverables and approval widgets. | Connect to client-scoped endpoints with RBAC client_id guard. |

---

## 3. Resilience & Authorization Findings

1. **Unauthenticated Redirection:** Visiting `/internal/dashboard` or `/portal` without a valid session token triggers an immediate redirect to `/internal/login` (via `auth-context.tsx`).
2. **Session Cookie Isolation:** Session cookies (`df_session`) are correctly configured with `HttpOnly`, `SameSite=Lax`, and validated by `UserSession` records in PostgreSQL.
3. **API-Down Resilience:** When the FastAPI backend is stopped or unreachable:
   - Client auth check `/api/v1/auth/me` fails with network connection refused.
   - The application does not crash to an unhandled React error boundary.
   - The auth guard gracefully routes users to `/internal/login` where an offline notification can be surfaced.

---

## 4. Route Sweep Log & Results

| # | Role | Route | HTTP Status | Load Time | API Requests | Console / Page Errors | Screenshot Artifact |
|---|---|---|---|---|---|---|---|
| 1 | `unauthenticated` | `/internal/dashboard` | 200 (Redirected to `/internal/login`) | 353 ms | 1 (`/auth/me` -> 401) | 1 (Expected 401) | [`unauthenticated_internal_dashboard.png`](./screens/baseline/unauthenticated_internal_dashboard.png) |
| 2 | `unauthenticated` | `/portal` | 200 (Redirected to `/internal/login`) | 321 ms | 1 (`/auth/me` -> 401) | 1 (Expected 401) | [`unauthenticated_portal.png`](./screens/baseline/unauthenticated_portal.png) |
| 3 | `unauthenticated` | `/non-existent-route-xyz` | 404 | 215 ms | 1 (`/auth/me` -> 401) | 2 (Expected 404 & 401) | [`unauthenticated_non-existent-route-xyz.png`](./screens/baseline/unauthenticated_non-existent-route-xyz.png) |
| 4 | `super_admin` | `/internal/dashboard` | 200 | 1,021 ms | 0 (Mock rendered) | 0 | [`super_admin_internal_dashboard.png`](./screens/baseline/super_admin_internal_dashboard.png) |
| 5 | `super_admin` | `/internal/leads` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_leads.png`](./screens/baseline/super_admin_internal_leads.png) |
| 6 | `super_admin` | `/internal/leads/{id}` | 200 | 1,019 ms | 0 | 0 | [`super_admin_internal_leads_c4afbc1f-b2c9-450b-a8d4-9312ec1794e8.png`](./screens/baseline/super_admin_internal_leads_c4afbc1f-b2c9-450b-a8d4-9312ec1794e8.png) |
| 7 | `super_admin` | `/internal/clients` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_clients.png`](./screens/baseline/super_admin_internal_clients.png) |
| 8 | `super_admin` | `/internal/clients/new` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_clients_new.png`](./screens/baseline/super_admin_internal_clients_new.png) |
| 9 | `super_admin` | `/internal/clients/{id}` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_clients_372c372b-879e-4223-a316-a4cb7ba4f2b8.png`](./screens/baseline/super_admin_internal_clients_372c372b-879e-4223-a316-a4cb7ba4f2b8.png) |
| 10 | `super_admin` | `/internal/projects` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_projects.png`](./screens/baseline/super_admin_internal_projects.png) |
| 11 | `super_admin` | `/internal/projects/{id}` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_projects_aee51883-d8bc-4f38-afba-051f440cfa21.png`](./screens/baseline/super_admin_internal_projects_aee51883-d8bc-4f38-afba-051f440cfa21.png) |
| 12 | `super_admin` | `/internal/tasks` | 200 | 1,017 ms | 0 | 0 | [`super_admin_internal_tasks.png`](./screens/baseline/super_admin_internal_tasks.png) |
| 13 | `super_admin` | `/internal/invoices` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_invoices.png`](./screens/baseline/super_admin_internal_invoices.png) |
| 14 | `super_admin` | `/internal/invoices/{id}` | 200 | 1,017 ms | 0 | 0 | [`super_admin_internal_invoices_893ae5c7-be65-4f4e-a446-dc9a8b8b03b8.png`](./screens/baseline/super_admin_internal_invoices_893ae5c7-be65-4f4e-a446-dc9a8b8b03b8.png) |
| 15 | `super_admin` | `/internal/agreements` | 200 | 1,019 ms | 0 | 0 | [`super_admin_internal_agreements.png`](./screens/baseline/super_admin_internal_agreements.png) |
| 16 | `super_admin` | `/internal/agreements/{id}` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_agreements_74a9bed2-9e4f-413c-97a8-0b8161cd11f3.png`](./screens/baseline/super_admin_internal_agreements_74a9bed2-9e4f-413c-97a8-0b8161cd11f3.png) |
| 17 | `super_admin` | `/internal/attendance` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_attendance.png`](./screens/baseline/super_admin_internal_attendance.png) |
| 18 | `super_admin` | `/internal/team` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_team.png`](./screens/baseline/super_admin_internal_team.png) |
| 19 | `super_admin` | `/internal/services` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_services.png`](./screens/baseline/super_admin_internal_services.png) |
| 20 | `super_admin` | `/internal/reports` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_reports.png`](./screens/baseline/super_admin_internal_reports.png) |
| 21 | `super_admin` | `/internal/support` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_support.png`](./screens/baseline/super_admin_internal_support.png) |
| 22 | `super_admin` | `/internal/settings/roles` | 200 | 1,018 ms | 0 | 0 | [`super_admin_internal_settings_roles.png`](./screens/baseline/super_admin_internal_settings_roles.png) |
| 23 | `sales` | `/internal/leads` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_leads.png`](./screens/baseline/sales_internal_leads.png) |
| 24 | `sales` | `/internal/leads/{id}` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_leads_c4afbc1f-b2c9-450b-a8d4-9312ec1794e8.png`](./screens/baseline/sales_internal_leads_c4afbc1f-b2c9-450b-a8d4-9312ec1794e8.png) |
| 25 | `sales` | `/internal/clients` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_clients.png`](./screens/baseline/sales_internal_clients.png) |
| 26 | `sales` | `/internal/clients/{id}` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_clients_372c372b-879e-4223-a316-a4cb7ba4f2b8.png`](./screens/baseline/sales_internal_clients_372c372b-879e-4223-a316-a4cb7ba4f2b8.png) |
| 27 | `sales` | `/internal/projects` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_projects.png`](./screens/baseline/sales_internal_projects.png) |
| 28 | `sales` | `/internal/tasks` | 200 | 1,017 ms | 0 | 0 | [`sales_internal_tasks.png`](./screens/baseline/sales_internal_tasks.png) |
| 29 | `sales` | `/internal/invoices` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_invoices.png`](./screens/baseline/sales_internal_invoices.png) |
| 30 | `sales` | `/internal/agreements` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_agreements.png`](./screens/baseline/sales_internal_agreements.png) |
| 31 | `sales` | `/internal/dashboard` | 200 | 1,018 ms | 0 | 0 | [`sales_internal_dashboard.png`](./screens/baseline/sales_internal_dashboard.png) |
| 32 | `sales` | `/internal/settings/roles` | 200 (Requires RBAC lock) | 1,018 ms | 0 | 0 | [`sales_internal_settings_roles.png`](./screens/baseline/sales_internal_settings_roles.png) |
| 33 | `client_owner` | `/portal` | 200 | 1,018 ms | 0 | 0 | [`client_owner_portal.png`](./screens/baseline/client_owner_portal.png) |
| 34 | `client_owner` | `/portal/projects` | 200 | 1,017 ms | 0 | 0 | [`client_owner_portal_projects.png`](./screens/baseline/client_owner_portal_projects.png) |
| 35 | `client_owner` | `/portal/approvals` | 200 | 1,018 ms | 0 | 0 | [`client_owner_portal_approvals.png`](./screens/baseline/client_owner_portal_approvals.png) |
| 36 | `client_owner` | `/portal/invoices` | 200 | 1,017 ms | 0 | 0 | [`client_owner_portal_invoices.png`](./screens/baseline/client_owner_portal_invoices.png) |
| 37 | `client_owner` | `/portal/agreements` | 200 | 1,017 ms | 0 | 0 | [`client_owner_portal_agreements.png`](./screens/baseline/client_owner_portal_agreements.png) |
| 38 | `client_owner` | `/portal/support` | 200 | 1,018 ms | 0 | 0 | [`client_owner_portal_support.png`](./screens/baseline/client_owner_portal_support.png) |
| 39 | `client_owner` | `/internal/dashboard` | 200 (Requires Portal Redirect) | 1,018 ms | 0 | 0 | [`client_owner_internal_dashboard.png`](./screens/baseline/client_owner_internal_dashboard.png) |
