import { expect, test } from "@playwright/test";
import { deleteTestUser } from "./helpers/db";
import { fakeClientIp } from "./helpers/rate-limit-bypass";

test.use({ extraHTTPHeaders: { "x-forwarded-for": fakeClientIp("cross-user-spec") } });

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "E2E Tester");
  await page.fill("#email", email);
  await page.fill("#password", "TestPass123!");
  await page.fill("#confirmPassword", "TestPass123!");
  await page.click('button[type="submit"]:has-text("Create account")');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

// UI-reachable half of ownership isolation: a user's expense list must never
// include another user's data. This can't reach the deeper query-forgery
// boundary (the UI never exposes another user's row id to try), which is
// what tests/unit/dal/ownership.test.ts covers instead.
test("a user's expense list never shows another user's expenses", async ({ page }) => {
  const emailA = `e2e-crossuser-a-${Date.now()}@example.com`;
  const emailB = `e2e-crossuser-b-${Date.now()}@example.com`;
  try {
    await register(page, emailA);
    await page.goto("/expenses");
    await page.click('button:has-text("Add expense")');
    await page.fill("#description", "User A's private expense");
    await page.fill("#amount", "99.99");
    await page.click('button[type="submit"]:has-text("Add expense")');
    await expect(page.locator("tr", { hasText: "User A's private expense" })).toBeVisible();

    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/\/login/);

    await register(page, emailB);
    await page.goto("/expenses");
    await expect(page.locator("tr", { hasText: "User A's private expense" })).toHaveCount(0);
  } finally {
    await deleteTestUser(emailA);
    await deleteTestUser(emailB);
  }
});
