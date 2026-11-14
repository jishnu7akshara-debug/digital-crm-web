import { test, expect } from "@playwright/test";

test.describe("Stage A Verification: Security, Network Resilience & RBAC Boundaries", () => {
  test("A2: With backend API unreachable, /internal/leads displays ServiceUnavailable and does NOT redirect to login", async ({
    page,
  }) => {
    // Abort all API v1 calls to simulate complete API server down
    await page.route("**/api/v1/**", (route) => route.abort("connectionrefused"));

    await page.goto("/internal/leads", { waitUntil: "domcontentloaded" });

    // Assert that ServiceUnavailable is rendered
    const unavailableHeading = page.getByRole("heading", { name: "We can't reach the server" });
    await expect(unavailableHeading).toBeVisible({ timeout: 10000 });

    // Assert that URL was NOT redirected to login
    expect(page.url()).not.toContain("/login");
    expect(page.url()).toContain("/internal/leads");
  });

  test("A3.1: Sales role visiting /internal/settings/roles gets 403 Access Denied page and 403 API response", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    // 1. Log in as Sales user
    await page.goto("/internal/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("qa.sales@example.com");
    await page.locator('input[type="password"]').fill("QaTest@12345!");
    
    const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
    await page.locator('button[type="submit"]').click();
    const loginRes = await loginResPromise;
    expect(loginRes.status()).toBe(200);

    // Wait for post-login destination
    await page.waitForURL("**/internal/**", { timeout: 15000 });

    // 2. Track API requests to /api/v1/roles
    let rolesApiStatus = 0;
    let rolesResponseBody = "";
    page.on("response", async (res) => {
      if (res.url().includes("/api/v1/roles")) {
        rolesApiStatus = res.status();
        try {
          rolesResponseBody = await res.text();
        } catch {}
      }
    });

    // 3. Navigate to forbidden /internal/settings/roles
    await page.goto("/internal/settings/roles", { waitUntil: "domcontentloaded" });

    // Assert 403 Access Denied component renders
    const deniedBox = page.locator('[data-testid="access-denied-403"]');
    await expect(deniedBox).toBeVisible({ timeout: 15000 });
    await expect(deniedBox).toContainText("403 Forbidden");
    await expect(deniedBox).toContainText("Access Denied");
    await expect(deniedBox).toContainText("settings.read");

    // Assert that direct roles API call returns 403 Forbidden
    const rolesApiRes = await page.request.get("http://localhost:3000/api/v1/roles");
    expect(rolesApiRes.status()).toBe(403);
    const rolesJson = await rolesApiRes.json();
    expect(rolesJson.error.message).toMatch(/(Super Admin privileges required|Permission .* required)/);

    // Take screenshot for proof
    await page.screenshot({ path: "../../docs/qa/screens/sales_403_roles.png", fullPage: true });
  });

  test("A3.2: Client portal user visiting /internal/dashboard is redirected to /portal and blocked from /api/v1/dashboard/kpis", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    // 1. Log in as Client user
    await page.goto("/portal/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("qa.client@example.com");
    await page.locator('input[type="password"]').fill("QaTest@12345!");

    const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
    await page.locator('button[type="submit"]').click();
    const loginRes = await loginResPromise;
    expect(loginRes.status()).toBe(200);

    await page.waitForURL("**/portal", { timeout: 15000 });

    // 2. Attempt direct API request to /api/v1/dashboard/kpis via page context cookies
    const apiRes = await page.request.get("http://localhost:3000/api/v1/dashboard/kpis");
    expect(apiRes.status()).toBe(403);
    const apiJson = await apiRes.json();
    expect(apiJson.error.message).toContain("Client portal accounts cannot access internal staff endpoints.");

    // 3. Attempt navigation to /internal/dashboard -> must be pushed back to /portal
    await page.goto("/internal/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/portal", { timeout: 10000 });
    expect(page.url()).toContain("/portal");

    // Take screenshot for proof
    await page.screenshot({ path: "../../docs/qa/screens/client_redirected_portal.png", fullPage: true });
  });
});
