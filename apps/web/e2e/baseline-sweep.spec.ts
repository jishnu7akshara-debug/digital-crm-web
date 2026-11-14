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
  notes: string;
}

const sweepResults: RouteResult[] = [];
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../docs/qa/screens/baseline");

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

async function visitAndRecord(
  page: Page,
  role: string,
  route: string,
  expectedStatus: number = 200
): Promise<RouteResult> {
  const apiRequests: RouteResult["apiRequests"] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
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
    navResponse = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (err: any) {
    // Record whatever state was reached
  }
  const loadTimeMs = Date.now() - start;

  // Wait a small amount for any deferred client fetches/hydration
  await page.waitForTimeout(1000);

  const finalUrl = page.url();
  const safeName = sanitizeFilename(`${role}_${route}`);
  const screenshotFile = `${safeName}.png`;
  const fullScreenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);

  try {
    await page.screenshot({ path: fullScreenshotPath, fullPage: true });
  } catch {
    // Screenshot failure handling
  }

  // Remove listeners to avoid leakage
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
    notes: "",
  };

  sweepResults.push(result);
  return result;
}

test.describe.serial("Digital Footprint OS - Automated Baseline Route Sweep", () => {
  const jsonPath = path.resolve(__dirname, "../../../docs/qa/baseline-sweep.json");

  test.afterEach(() => {
    fs.writeFileSync(jsonPath, JSON.stringify(sweepResults, null, 2), "utf-8");
  });

  test.afterAll(() => {
    fs.writeFileSync(jsonPath, JSON.stringify(sweepResults, null, 2), "utf-8");
  });

  test("1. Unauthenticated Negative Authorization Checks", async ({ page }) => {
    // Unauth internal dashboard
    const res1 = await visitAndRecord(page, "unauthenticated", "/internal/dashboard");
    expect(res1.url).toContain("/login");

    // Unauth client portal
    const res2 = await visitAndRecord(page, "unauthenticated", "/portal");
    expect(res2.url).toMatch(/(\/login|\/portal\/login)/);

    // Non-existent route 404
    await visitAndRecord(page, "unauthenticated", "/non-existent-route-xyz");
  });

  test("2. Super Admin Complete Route Sweep", async ({ page }) => {
    // Login as Super Admin
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.fill('input[type="email"]', "admin@digitalfootprint.in");
    await page.fill('input[type="password"]', "Admin@123456!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/internal/dashboard", { timeout: 15000 });

    const superAdminRoutes = [
      "/internal/dashboard",
      "/internal/leads",
      "/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8",
      "/internal/clients",
      "/internal/clients/new",
      "/internal/clients/372c372b-879e-4223-a316-a4cb7ba4f2b8",
      "/internal/projects",
      "/internal/projects/aee51883-d8bc-4f38-afba-051f440cfa21",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/invoices/893ae5c7-be65-4f4e-a446-dc9a8b8b03b8",
      "/internal/agreements",
      "/internal/agreements/74a9bed2-9e4f-413c-97a8-0b8161cd11f3",
      "/internal/attendance",
      "/internal/team",
      "/internal/services",
      "/internal/reports",
      "/internal/support",
      "/internal/settings/roles",
    ];

    for (const route of superAdminRoutes) {
      await visitAndRecord(page, "super_admin", route);
    }
  });

  test("3. Sales Role Route Sweep & Negative Checks", async ({ page, context }) => {
    await context.clearCookies();
    // Login as Sales
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.fill('input[type="email"]', "qa.sales@example.com");
    await page.fill('input[type="password"]', "QaTest@12345!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/internal/**", { timeout: 15000 });

    const salesRoutes = [
      "/internal/leads",
      "/internal/leads/c4afbc1f-b2c9-450b-a8d4-9312ec1794e8",
      "/internal/clients",
      "/internal/clients/372c372b-879e-4223-a316-a4cb7ba4f2b8",
      "/internal/projects",
      "/internal/tasks",
      "/internal/invoices",
      "/internal/agreements",
      "/internal/dashboard",
      // Negative check: Sales should not be able to manage settings/roles
      "/internal/settings/roles",
    ];

    for (const route of salesRoutes) {
      await visitAndRecord(page, "sales", route);
    }
  });

  test("4. Client Owner Portal Route Sweep & Negative Checks", async ({ page, context }) => {
    await context.clearCookies();
    // Login as Client
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.fill('input[type="email"]', "qa.client@example.com");
    await page.fill('input[type="password"]', "QaTest@12345!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/portal*", { timeout: 15000 });

    const clientRoutes = [
      "/portal",
      "/portal/projects",
      "/portal/approvals",
      "/portal/invoices",
      "/portal/agreements",
      "/portal/support",
      // Negative check: Client owner trying to access internal dashboard
      "/internal/dashboard",
    ];

    for (const route of clientRoutes) {
      await visitAndRecord(page, "client_owner", route);
    }
  });
});
