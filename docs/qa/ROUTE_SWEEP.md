# Digital Footprint OS — Production Automated Route Sweep Report

**Execution Time:** 2026-11-16T06:11:51.562Z
**Total Routes Checked:** 41
**Passed:** 41 | **Failed:** 0

| Role | Route | Final URL | API Calls (Non-Auth) | Skeletons | Size (KB) | Verdict |
|---|---|---|---|---|---|---|
| `unauthenticated` | `/internal/dashboard` | `/internal/login` | None | 0 | 31.9 KB | ✅ PASS |
| `unauthenticated` | `/portal` | `/portal/login` | None | 0 | 27.0 KB | ✅ PASS |
| `super_admin` | `/internal/dashboard` | `/internal/dashboard` | GET /dashboard/kpis (200) | 0 | 190.7 KB | ✅ PASS |
| `super_admin` | `/internal/leads` | `/internal/leads` | GET /leads?page_size=100 (200) | 0 | 237.2 KB | ✅ PASS |
| `super_admin` | `/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8` | `/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8` | GET /leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8/activities (200)<br/>GET /leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8 (200) | 0 | 128.6 KB | ✅ PASS |
| `super_admin` | `/internal/opportunities` | `/internal/opportunities` | GET /proposals?page_size=100 (200) | 0 | 112.2 KB | ✅ PASS |
| `super_admin` | `/internal/opportunities/PRP-2026-0001` | `/internal/opportunities/PRP-2026-0001` | GET /proposals/PRP-2026-0001 (200) | 0 | 113.1 KB | ✅ PASS |
| `super_admin` | `/internal/clients` | `/internal/clients` | GET /clients?page_size=100 (200) | 0 | 264.6 KB | ✅ PASS |
| `super_admin` | `/internal/clients/new` | `/internal/clients/new` | None | 0 | 144.3 KB | ✅ PASS |
| `super_admin` | `/internal/clients/cli-apex-01` | `/internal/clients/cli-apex-01` | GET /clients/cli-apex-01 (200) | 0 | 161.9 KB | ✅ PASS |
| `super_admin` | `/internal/services` | `/internal/services` | GET /services (200) | 0 | 133.7 KB | ✅ PASS |
| `super_admin` | `/internal/agreements` | `/internal/agreements` | GET /agreements (200) | 0 | 167.9 KB | ✅ PASS |
| `super_admin` | `/internal/agreements/agr-apex-msa-01` | `/internal/agreements/agr-apex-msa-01` | GET /agreements/agr-apex-msa-01 (200) | 0 | 167.0 KB | ✅ PASS |
| `super_admin` | `/internal/contracts` | `/internal/agreements` | GET /agreements (200) | 0 | 167.9 KB | ✅ PASS |
| `super_admin` | `/internal/projects` | `/internal/projects` | GET /projects?page_size=100 (200) | 0 | 132.1 KB | ✅ PASS |
| `super_admin` | `/internal/projects/proj-apex-01` | `/internal/projects/proj-apex-01` | GET /projects/proj-apex-01 (200) | 0 | 127.4 KB | ✅ PASS |
| `super_admin` | `/internal/tasks` | `/internal/tasks` | GET /tasks?page_size=100 (200) | 0 | 181.1 KB | ✅ PASS |
| `super_admin` | `/internal/invoices` | `/internal/invoices` | GET /invoices?page_size=100 (200) | 0 | 337.2 KB | ✅ PASS |
| `super_admin` | `/internal/invoices/new` | `/internal/invoices/new` | GET /clients?page_size=100 (200) | 0 | 133.7 KB | ✅ PASS |
| `super_admin` | `/internal/invoices/inv-apex-01` | `/internal/invoices/inv-apex-01` | GET /invoices/inv-apex-01 (200) | 0 | 150.2 KB | ✅ PASS |
| `super_admin` | `/internal/attendance` | `/internal/attendance` | GET /attendance/summary?filter_range=this_month (200)<br/>GET /attendance/records?filter_range=this_month&page_size=50 (200)<br/>GET /attendance/today-status (200) | 0 | 158.0 KB | ✅ PASS |
| `super_admin` | `/internal/team` | `/internal/team` | GET /team (200) | 0 | 143.7 KB | ✅ PASS |
| `super_admin` | `/internal/reports` | `/internal/reports` | GET /reports/overview (200) | 0 | 132.7 KB | ✅ PASS |
| `super_admin` | `/internal/support` | `/internal/support` | GET /support/tickets?status_filter= (200) | 0 | 89.8 KB | ✅ PASS |
| `super_admin` | `/internal/settings/roles` | `/internal/settings/roles` | GET /roles (200) | 0 | 308.2 KB | ✅ PASS |
| `sales` | `/internal/dashboard` | `/internal/dashboard` | GET /dashboard/kpis (200) | 0 | 188.7 KB | ✅ PASS |
| `sales` | `/internal/leads` | `/internal/leads` | GET /leads?page_size=100 (200) | 0 | 104.1 KB | ✅ PASS |
| `sales` | `/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8` | `/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8` | GET /leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8 (200)<br/>GET /leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8/activities (200) | 0 | 127.5 KB | ✅ PASS |
| `sales` | `/internal/opportunities` | `/internal/opportunities` | GET /proposals?page_size=100 (200) | 0 | 111.2 KB | ✅ PASS |
| `sales` | `/internal/clients` | `/internal/clients` | GET /clients?page_size=100 (200) | 0 | 111.8 KB | ✅ PASS |
| `sales` | `/internal/clients/cli-apex-01` | `/internal/clients/cli-apex-01` | GET /clients/cli-apex-01 (200) | 0 | 160.8 KB | ✅ PASS |
| `sales` | `/internal/projects` | `/internal/projects` | GET /projects?page_size=100 (200) | 0 | 117.7 KB | ✅ PASS |
| `sales` | `/internal/tasks` | `/internal/tasks` | GET /tasks?page_size=100 (200) | 0 | 180.3 KB | ✅ PASS |
| `sales` | `/internal/invoices` | `/internal/invoices` | GET /invoices?page_size=100 (200) | 0 | 242.6 KB | ✅ PASS |
| `sales` | `/internal/agreements` | `/internal/agreements` | GET /agreements (200) | 0 | 166.6 KB | ✅ PASS |
| `client_owner` | `/portal` | `/portal` | GET /projects/deliverables/pending (200)<br/>GET /invoices?page_size=4 (200)<br/>GET /projects?page_size=6 (200) | 0 | 106.7 KB | ✅ PASS |
| `client_owner` | `/portal/projects` | `/portal/projects` | GET /projects?page_size=50 (200) | 0 | 45.7 KB | ✅ PASS |
| `client_owner` | `/portal/approvals` | `/portal/approvals` | GET /projects/deliverables/pending (200) | 0 | 44.3 KB | ✅ PASS |
| `client_owner` | `/portal/invoices` | `/portal/invoices` | GET /invoices?page_size=50 (200) | 0 | 122.4 KB | ✅ PASS |
| `client_owner` | `/portal/agreements` | `/portal/agreements` | GET /agreements (200) | 0 | 121.9 KB | ✅ PASS |
| `client_owner` | `/portal/support` | `/portal/support` | GET /support/tickets (200) | 0 | 40.1 KB | ✅ PASS |
