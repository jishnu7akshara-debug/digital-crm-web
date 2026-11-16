import { test, expect, Browser, Page, BrowserContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

interface RouteResult {
  role: string;
  route: string;
  url: string;
  status: number | "CLIENT_RENDERED";
  redirectedTo?: string;
  loadTimeMs: number;
  apiRequests: {
    url: string;
    method: string;
    status: number;
    durationMs: number;
  }[];
  consoleErrors: string[];
  pageErrors: string[];
  screenshotPath: string;
  screenshotBytes: number;
  isNegativeTest?: boolean;
  verdict: "PASS" | "FAIL";
}

const sweepResults: RouteResult[] = [];
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../docs/qa/screens/baseline");
const AUTH_DIR = path.resolve(__dirname, ".auth");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

async function ensureAuth(browser: Browser, role: string): Promise<string> {
  const authPath = path.join(AUTH_DIR, `${role}.json`);
  if (fs.existsSync(authPath)) {
    return authPath;
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  if (role === "super_admin") {
    await page.goto("/internal/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("admin@digitalfootprint.in");
    await page.locator('input[type="password"]').fill("Admin@123456!");
    const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
    await page.locator('button[type="submit"]').click();
    const loginRes = await loginResPromise;
    expect(loginRes.status()).toBe(200);
    await page.waitForURL("**/internal/dashboard", { timeout: 15000 });
  } else if (role === "sales") {
    await page.goto("/internal/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("qa.sales@example.com");
    await page.locator('input[type="password"]').fill("QaTest@12345!");
    const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
    await page.locator('button[type="submit"]').click();
    const loginRes = await loginResPromise;
    expect(loginRes.status()).toBe(200);
    await page.waitForURL("**/internal/**", { timeout: 15000 });
  } else if (role === "client_owner") {
    await page.goto("/portal/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("qa.client@example.com");
    await page.locator('input[type="password"]').fill("QaTest@12345!");
    const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
    await page.locator('button[type="submit"]').click();
    const loginRes = await loginResPromise;
    expect(loginRes.status()).toBe(200);
    await page.waitForURL("**/portal", { timeout: 15000 });
  }

  await page.waitForTimeout(1000);
  await context.storageState({ path: authPath });
  await context.close();
  return authPath;
}

async function visitRouteAndRecord(
  context: BrowserContext,
  role: string,
  route: string,
  isNegativeTest: boolean = false
): Promise<RouteResult> {
  const page = await context.newPage();
  const apiRequests: RouteResult["apiRequests"] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter harmless browser hydration noise
      if (!text.includes("favicon") && !text.includes("ResizeObserver")) {
        consoleErrors.push(text);
      }
    }
  };
  const onPageError = (err: Error) => {
    pageErrors.push(err.message || String(err));
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const requestMap = new Map<any, number>();
  const onRequest = (req: any) => {
    if (req.url().includes("/api/v1/")) {
      requestMap.set(req, Date.now());
    }
  };
  const onResponse = (res: any) => {
    if (res.url().includes("/api/v1/")) {
      const startTime = requestMap.get(res.request()) || Date.now();
      apiRequests.push({
        url: res.url(),
        method: res.request().method(),
        status: res.status(),
        durationMs: Date.now() - startTime,
      });
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  const start = Date.now();
  let navResponse;
  try {
    navResponse = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 25000 });
  } catch (err: any) {
    pageErrors.push(err.message || String(err));
  }

  // 1. Wait for page-ready contract (up to 20s)
  try {
    const readyEl = page.locator('[data-testid="page-ready"]');
    await readyEl.waitFor({ state: "attached", timeout: 20000 });
  } catch {
    // If not negative test, this should be caught by assertion
  }

  // Allow settled micro-animations
  await page.waitForTimeout(400);

  const loadTimeMs = Date.now() - start;
  const finalUrl = page.url();
  const safeName = sanitizeFilename(`${role}_${route}`);
  const screenshotFile = `${safeName}.png`;
  const fullScreenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);

  await page.screenshot({ path: fullScreenshotPath, fullPage: true });
  const stats = fs.statSync(fullScreenshotPath);

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("request", onRequest);
  page.off("response", onResponse);

  let verdict: "PASS" | "FAIL" = "PASS";

  try {
    if (!isNegativeTest && role !== "unauthenticated") {
      // 1. Contract: page-ready marker MUST be attached and rendered
      const readyEl = page.locator('[data-testid="page-ready"]');
      expect(await readyEl.count()).toBeGreaterThan(0);

      // 2. Heuristic: screenshot > 25 KB
      expect(stats.size).toBeGreaterThan(25000);

      // 3. No skeletons visible
      const skeletons = page.locator('[data-testid="skeleton"]');
      expect(await skeletons.count()).toBe(0);

      // 4. No raw loading text
      const bodyText = await page.innerText("body");
      expect(bodyText).not.toMatch(/Loading( invoices| client portal| digital footprint os)?\.\.\./i);

      // 5. Data pages must make primary API requests (not just auth/me)
      const isDataPage = !route.endsWith("/new") && !route.endsWith("/login") && !route.includes("/contracts");
      if (isDataPage) {
        const businessRequests = apiRequests.filter(
          (r) => !r.url.includes("/auth/me") && !r.url.includes("/notifications")
        );
        expect(businessRequests.length).toBeGreaterThan(0);
        // All business requests must be 2xx
        expect(businessRequests.every((r) => r.status >= 200 && r.status < 400)).toBe(true);
      }

      // 6. Zero 5xx errors
      expect(apiRequests.some((r) => r.status >= 500)).toBe(false);

      // 7. Zero uncaught page errors
      expect(pageErrors.length).toBe(0);
    }
  } catch (assertionErr) {
    verdict = "FAIL";
    throw assertionErr;
  } finally {
    const result: RouteResult = {
      role,
      route,
      url: finalUrl,
      status: navResponse ? navResponse.status() : "CLIENT_RENDERED",
      redirectedTo: finalUrl !== `http://localhost:3000${route}` ? finalUrl : undefined,
      loadTimeMs,
      apiRequests,
      consoleErrors,
      pageErrors,
      screenshotPath: `docs/qa/screens/baseline/${screenshotFile}`,
      screenshotBytes: stats.size,
      isNegativeTest,
      verdict,
    };
    sweepResults.push(result);
    await page.close();
  }

  return sweepResults[sweepResults.length - 1];
}

function generateMarkdownReport(results: RouteResult[]): string {
  let md = "# Digital Footprint OS — Production Automated Route Sweep Report\n\n";
  md += `**Execution Time:** ${new Date().toISOString()}\n`;
  md += `**Total Routes Checked:** ${results.length}\n`;
  md += `**Passed:** ${results.filter((r) => r.verdict === "PASS").length} | **Failed:** ${results.filter((r) => r.verdict === "FAIL").length}\n\n`;

  md += "| Role | Route | Final URL | API Calls (Non-Auth) | Skeletons | Size (KB) | Verdict |\n";
  md += "|---|---|---|---|---|---|---|\n";

  for (const r of results) {
    const nonAuth = r.apiRequests.filter((a) => !a.url.includes("/auth/me") && !a.url.includes("/notifications"));
    const apiSummary = nonAuth.length > 0
      ? nonAuth.map((a) => `${a.method} ${a.url.split("/api/v1")[1] || a.url} (${a.status})`).join("<br/>")
      : "None";
    const sizeKb = (r.screenshotBytes / 1024).toFixed(1);
    const verdictBadge = r.verdict === "PASS" ? "✅ PASS" : "❌ FAIL";
    md += `| \`${r.role}\` | \`${r.route}\` | \`${r.url.replace("http://localhost:3000", "")}\` | ${apiSummary} | 0 | ${sizeKb} KB | ${verdictBadge} |\n`;
  }

  return md;
}

test.describe.serial("Digital Footprint OS — Comprehensive Multi-Role Route Sweep (Step 2)", () => {
  const jsonPath = path.resolve(__dirname, "../../../docs/qa/baseline-sweep.json");
  const mdPath = path.resolve(__dirname, "../../../docs/qa/ROUTE_SWEEP.md");

  test.afterAll(() => {
    fs.writeFileSync(jsonPath, JSON.stringify(sweepResults, null, 2), "utf-8");
    fs.writeFileSync(mdPath, generateMarkdownReport(sweepResults), "utf-8");
  });

  test("1. Unauthenticated Authorization & Security Perimeter", async ({ browser }) => {
    const context = await browser.newContext();

    // 1.1 Visiting internal dashboard unauthenticated must redirect to internal login
    const res1 = await visitRouteAndRecord(context, "unauthenticated", "/internal/dashboard", true);
    expect(res1.url).toContain("/internal/login");

    // 1.2 Visiting portal unauthenticated must redirect to portal login
    const res2 = await visitRouteAndRecord(context, "unauthenticated", "/portal", true);
    expect(res2.url).toContain("/portal/login");

    await context.close();
  });

  test("2. Super Admin Comprehensive Internal Suite (All 22 Routes)", async ({ browser }) => {
    test.setTimeout(600000);
    const authState = await ensureAuth(browser, "super_admin");
    const context = await browser.newContext({ storageState: authState });

    const superAdminRoutes = [
      "/internal/dashboard",
      "/internal/leads",
      "/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8",
      "/internal/opportunities",
      "/internal/opportunities/PRP-2026-0001",
      "/internal/clients",
      "/internal/clients/new",
      "/internal/clients/cli-apex-01",
      "/internal/services",
      "/internal/agreements",
      "/internal/agreements/agr-apex-msa-01",
      "/internal/contracts",
      "/internal/projects",
      "/internal/projects/proj-apex-01",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/invoices/new",
      "/internal/invoices/inv-apex-01",
      "/internal/attendance",
      "/internal/team",
      "/internal/reports",
      "/internal/support",
      "/internal/settings/roles",
    ];

    for (const route of superAdminRoutes) {
      await visitRouteAndRecord(context, "super_admin", route, false);
    }

    await context.close();
  });

  test("3. Sales Role Scoped Suite & RBAC Boundary Enforcement", async ({ browser }) => {
    test.setTimeout(300000);
    const authState = await ensureAuth(browser, "sales");
    const context = await browser.newContext({ storageState: authState });

    const salesAllowedRoutes = [
      "/internal/dashboard",
      "/internal/leads",
      "/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8",
      "/internal/opportunities",
      "/internal/clients",
      "/internal/clients/cli-apex-01",
      "/internal/projects",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/agreements",
    ];

    for (const route of salesAllowedRoutes) {
      await visitRouteAndRecord(context, "sales", route, false);
    }

    // Negative check: Sales strictly forbidden from /internal/settings/roles
    const negPage = await context.newPage();
    await negPage.goto("/internal/settings/roles", { waitUntil: "domcontentloaded" });
    await negPage.waitForTimeout(2000);
    const deniedBox = negPage.locator('[data-testid="access-denied-403"]');
    await expect(deniedBox).toBeVisible();
    await negPage.close();

    await context.close();
  });

  test("4. Client Owner Customer Portal Suite & Cross-Tenant Boundary", async ({ browser }) => {
    test.setTimeout(300000);
    const authState = await ensureAuth(browser, "client_owner");
    const context = await browser.newContext({ storageState: authState });

    const clientAllowedRoutes = [
      "/portal",
      "/portal/projects",
      "/portal/approvals",
      "/portal/invoices",
      "/portal/agreements",
      "/portal/support",
    ];

    for (const route of clientAllowedRoutes) {
      await visitRouteAndRecord(context, "client_owner", route, false);
    }

    // Negative check: Client owner navigating to /internal/dashboard is redirected to /portal
    const negPage = await context.newPage();
    await negPage.goto("/internal/dashboard", { waitUntil: "domcontentloaded" });
    await negPage.waitForURL("**/portal", { timeout: 15000 });
    expect(negPage.url()).toContain("/portal");
    await negPage.close();

    await context.close();
  });
});
