import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../../../docs/qa/screens/baseline");

test.describe("API-Down State Resilience Test", () => {
  test("Core routes behavior when backend API is unreachable", async ({ page }) => {
    // Intercept and abort all API requests to simulate backend API down
    await page.route("**/api/v1/**", (route) => route.abort("connectionrefused"));

    const coreRoutes = [
      { name: "login", path: "/login" },
      { name: "dashboard", path: "/internal/dashboard" },
      { name: "leads", path: "/internal/leads" },
      { name: "clients", path: "/internal/clients" },
    ];

    const apiDownLogs: { route: string; finalUrl: string; consoleErrors: string[] }[] = [];

    for (const r of coreRoutes) {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(r.path, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const shotPath = path.join(SCREENSHOT_DIR, `api_down_${r.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});

      apiDownLogs.push({
        route: r.path,
        finalUrl: page.url(),
        consoleErrors,
      });
    }

    const reportPath = path.resolve(__dirname, "../../../docs/qa/api-down-test.json");
    fs.writeFileSync(reportPath, JSON.stringify(apiDownLogs, null, 2), "utf-8");
  });
});
