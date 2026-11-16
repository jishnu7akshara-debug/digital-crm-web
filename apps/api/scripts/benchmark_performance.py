import time
import httpx

API_BASE = "http://127.0.0.1:8000/api/v1"
ADMIN_EMAIL = "admin@digitalfootprint.in"
ADMIN_PASSWORD = "Admin@123456!"

def run_benchmark():
    print("========================================")
    print("DCRM PERFORMANCE BENCHMARK (AFTER OPTIMIZATIONS)")
    print("========================================")
    
    with httpx.Client(timeout=30.0) as client:
        # 1. Health check
        t0 = time.perf_counter()
        r_health = client.get("http://127.0.0.1:8000/api/health")
        t_health = (time.perf_counter() - t0) * 1000
        print(f"Health Check: {r_health.status_code} in {t_health:.1f}ms")

        # 2. Login
        t0 = time.perf_counter()
        r_login = client.post(
            f"{API_BASE}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "portal_type": "internal"}
        )
        t_login = (time.perf_counter() - t0) * 1000
        print(f"Login ({ADMIN_EMAIL}): {r_login.status_code} in {t_login:.1f}ms")
        if r_login.status_code != 200:
            print("Login error:", r_login.text)
            return

        session_cookie = client.cookies.get("df_session")
        print(f"Session Cookie acquired: {session_cookie[:10]}...")

        # 3. /auth/me
        t0 = time.perf_counter()
        r_me = client.get(f"{API_BASE}/auth/me")
        t_me = (time.perf_counter() - t0) * 1000
        print(f"/auth/me: {r_me.status_code} in {t_me:.1f}ms")

        # 4. /dashboard/kpis (Previously 12,861ms)
        t0 = time.perf_counter()
        r_kpi = client.get(f"{API_BASE}/dashboard/kpis")
        t_kpi = (time.perf_counter() - t0) * 1000
        print(f"/dashboard/kpis: {r_kpi.status_code} in {t_kpi:.1f}ms")
        kpi_data = r_kpi.json().get("data", {})
        print(f"  - Total Clients: {kpi_data.get('total_clients')}")
        print(f"  - Active Projects: {kpi_data.get('active_projects')}")
        print(f"  - Pipeline Deals: {kpi_data.get('pipeline_total_deals')}")
        print(f"  - Monthly Revenue: ₹{kpi_data.get('monthly_revenue_rupees')}")

        # 5. Subsequent Login (Pool warm test)
        t0 = time.perf_counter()
        r_login2 = client.post(
            f"{API_BASE}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "portal_type": "internal"}
        )
        t_login2 = (time.perf_counter() - t0) * 1000
        print(f"Subsequent Login (Warm Pool): {r_login2.status_code} in {t_login2:.1f}ms")

    print("========================================")

if __name__ == "__main__":
    run_benchmark()
