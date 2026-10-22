import { expect, test } from "@playwright/test";

const dashboardRoutes = [
  "/dashboard",
  "/dashboard/live-map",
  "/dashboard/chartering",
  "/dashboard/which-vessel",
  "/dashboard/forecast",
  "/dashboard/vessels",
  "/dashboard/ports",
  "/dashboard/risk",
  "/dashboard/contract-simulator",
  "/dashboard/idle-time",
  "/dashboard/reports",
  "/dashboard/audit-log",
  "/dashboard/settings",
];

test("all dashboard routes load without an application error", async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of dashboardRoutes) {
    const response = await page.goto(route, { waitUntil: "commit", timeout: 60_000 });
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  }
});

test("mobile More navigation exposes all dashboard routes", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("voyageai-onboarding-complete", "true"));
  await page.goto("/dashboard", { waitUntil: "commit", timeout: 60_000 });
  const moreButton = page.locator('button[aria-controls="mobile-more-navigation"]');
  await expect(moreButton).toBeVisible();
  await moreButton.click();
  await expect(moreButton).toHaveAttribute("aria-expanded", "true");
  const sheetLinks = page.locator('nav[aria-label="All dashboard pages"] a');
  await expect(sheetLinks).toHaveCount(13);
  await expect(sheetLinks.filter({ hasText: "Settings" })).toHaveAttribute("href", "/dashboard/settings");
  await sheetLinks.filter({ hasText: "Settings" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
});
