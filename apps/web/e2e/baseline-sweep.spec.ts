import { test, expect, Page } from "@playwright/test";
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
}

const sweepResults: RouteResult[] = [];
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../docs/qa/screens/baseline");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

async function visitRouteAndRecord(
  page: Page,
  role: string,
  route: string,
  isNegativeTest: boolean = false
): Promise<RouteResult> {
  const apiRequests: RouteResult["apiRequests"] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
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
    navResponse = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch {}

  // Wait for loading spinner to detach if present
  try {
    const spinner = page.locator('[data-testid="loading-spinner"]');
    if (await spinner.count()) {
      await spinner.waitFor({ state: "detached", timeout: 10000 });
    }
  } catch {}

  // Allow settled network queries and UI hydration
  await page.waitForTimeout(2500);

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
  };

  sweepResults.push(result);

  // Proof protocol assertions on authenticated data pages
  if (!isNegativeTest && role !== "unauthenticated") {
    // Assert page has data and is not a blank spinner (< 25 KB)
    expect(stats.size).toBeGreaterThan(25000);
    // Assert apiRequests is not empty
    expect(apiRequests.length).toBeGreaterThan(0);
  }

  return result;
}

test.describe.serial("Digital Footprint OS - Strict Multi-Role Baseline Route Sweep (V-02)", () => {
  const jsonPath = path.resolve(__dirname, "../../../docs/qa/baseline-sweep.json");

  test.afterEach(() => {
    fs.writeFileSync(jsonPath, JSON.stringify(sweepResults, null, 2), "utf-8");
  });

  test.afterAll(() => {
    fs.writeFileSync(jsonPath, JSON.stringify(sweepResults, null, 2), "utf-8");
  });

  test("1. Unauthenticated Negative Authorization Checks", async ({ page }) => {
    const res1 = await visitRouteAndRecord(page, "unauthenticated", "/internal/dashboard", true);
    expect(res1.url).toContain("/internal/login");

    const res2 = await visitRouteAndRecord(page, "unauthenticated", "/portal", true);
    expect(res2.url).toContain("/portal/login");
  });

  test("2. Super Admin Comprehensive Route Sweep", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "e2e/.auth/super_admin.json" });
    const page = await context.newPage();

    const superAdminRoutes = [
      "/internal/dashboard",
      "/internal/leads",
      "/internal/leads/lead-techcorp-01",
      "/internal/clients",
      "/internal/clients/cli-apex-01",
      "/internal/projects",
      "/internal/projects/proj-apex-01",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/invoices/inv-apex-01",
      "/internal/agreements",
      "/internal/agreements/agr-apex-msa-01",
      "/internal/attendance",
      "/internal/team",
      "/internal/services",
      "/internal/reports",
      "/internal/support",
      "/internal/settings/roles",
    ];

    for (const route of superAdminRoutes) {
      await visitRouteAndRecord(page, "super_admin", route, false);
    }

    await context.close();
  });

  test("3. Sales Role Route Sweep & Negative Boundary Checks", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "e2e/.auth/sales.json" });
    const page = await context.newPage();

    const salesAllowedRoutes = [
      "/internal/dashboard",
      "/internal/leads",
      "/internal/leads/lead-techcorp-01",
      "/internal/clients",
      "/internal/clients/cli-apex-01",
      "/internal/projects",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/agreements",
    ];

    for (const route of salesAllowedRoutes) {
      await visitRouteAndRecord(page, "sales", route, false);
    }

    // Negative check: Sales strictly forbidden from /internal/settings/roles
    const negRes = await visitRouteAndRecord(page, "sales", "/internal/settings/roles", true);
    expect(negRes.url).toContain("/internal/settings/roles");
    const deniedBox = page.locator('[data-testid="access-denied-403"]');
    await expect(deniedBox).toBeVisible();

    await context.close();
  });

  test("4. Client Owner Portal Route Sweep & Negative Boundary Checks", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "e2e/.auth/client_owner.json" });
    const page = await context.newPage();

    const clientAllowedRoutes = [
      "/portal",
      "/portal/projects",
      "/portal/approvals",
      "/portal/invoices",
      "/portal/agreements",
      "/portal/support",
    ];

    for (const route of clientAllowedRoutes) {
      await visitRouteAndRecord(page, "client_owner", route, false);
    }

    // Negative check: Client owner navigating to /internal/dashboard is redirected to /portal
    const negRes = await visitRouteAndRecord(page, "client_owner", "/internal/dashboard", true);
    expect(negRes.url).toContain("/portal");

    await context.close();
  });
});
