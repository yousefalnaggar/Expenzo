import { expect, test } from "@playwright/test";
import { deleteTestUser } from "./helpers/db";
import { fakeClientIp } from "./helpers/rate-limit-bypass";

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}@example.com`;
}

test.use({ extraHTTPHeaders: { "x-forwarded-for": fakeClientIp("auth-spec") } });

test.describe("auth", () => {
  test("register lands on the dashboard, sign out returns to login", async ({ page }) => {
    const email = uniqueEmail("register");
    try {
      await page.goto("/register");
      await page.fill("#name", "E2E Tester");
      await page.fill("#email", email);
      await page.fill("#password", "TestPass123!");
      await page.fill("#confirmPassword", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Create account")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.click('button:has-text("Sign out")');
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await deleteTestUser(email);
    }
  });

  test("wrong password shows a generic error, never revealing which part was wrong", async ({
    page,
  }) => {
    const email = uniqueEmail("wrongpass");
    try {
      await page.goto("/register");
      await page.fill("#name", "E2E Tester");
      await page.fill("#email", email);
      await page.fill("#password", "TestPass123!");
      await page.fill("#confirmPassword", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Create account")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
      await page.click('button:has-text("Sign out")');
      await expect(page).toHaveURL(/\/login/);

      await page.fill("#email", email);
      await page.fill("#password", "TotallyWrongPassword!");
      await page.click('button[type="submit"]:has-text("Sign in")');

      await expect(page.locator("text=Invalid email or password.")).toBeVisible();

      await page.fill("#password", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Sign in")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    } finally {
      await deleteTestUser(email);
    }
  });
});
