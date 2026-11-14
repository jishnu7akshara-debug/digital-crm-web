import { test as setup, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const AUTH_DIR = path.resolve(__dirname, ".auth");
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

setup("authenticate super admin", async ({ page, context }) => {
  await page.goto("/internal/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill("admin@digitalfootprint.in");
  await page.locator('input[type="password"]').fill("Admin@123456!");

  const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
  await page.locator('button[type="submit"]').click();
  const loginRes = await loginResPromise;
  expect(loginRes.status()).toBe(200);

  await page.waitForURL("**/internal/dashboard", { timeout: 15000 });
  await page.waitForTimeout(2000);

  await context.storageState({ path: path.join(AUTH_DIR, "super_admin.json") });
});

setup("authenticate sales", async ({ page, context }) => {
  await page.goto("/internal/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill("qa.sales@example.com");
  await page.locator('input[type="password"]').fill("QaTest@12345!");

  const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
  await page.locator('button[type="submit"]').click();
  const loginRes = await loginResPromise;
  expect(loginRes.status()).toBe(200);

  await page.waitForURL("**/internal/**", { timeout: 15000 });
  await page.waitForTimeout(2000);

  await context.storageState({ path: path.join(AUTH_DIR, "sales.json") });
});

setup("authenticate client owner", async ({ page, context }) => {
  await page.goto("/portal/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill("qa.client@example.com");
  await page.locator('input[type="password"]').fill("QaTest@12345!");

  const loginResPromise = page.waitForResponse((res) => res.url().includes("/api/v1/auth/login"));
  await page.locator('button[type="submit"]').click();
  const loginRes = await loginResPromise;
  expect(loginRes.status()).toBe(200);

  await page.waitForURL("**/portal", { timeout: 15000 });
  await page.waitForTimeout(2000);

  await context.storageState({ path: path.join(AUTH_DIR, "client_owner.json") });
});
