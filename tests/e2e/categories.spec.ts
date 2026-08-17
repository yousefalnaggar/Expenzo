import { expect, test } from "@playwright/test";
import { deleteTestUser } from "./helpers/db";
import { fakeClientIp } from "./helpers/rate-limit-bypass";

test.use({ extraHTTPHeaders: { "x-forwarded-for": fakeClientIp("categories-spec") } });

const DEFAULT_CATEGORIES = [
  "Housing",
  "Utilities",
  "Food",
  "Transportation",
  "Healthcare",
  "Personal/Lifestyle",
];

test.describe("categories", () => {
  test("new accounts start with the six default categories, not an empty list", async ({
    page,
  }) => {
    const email = `e2e-categories-default-${Date.now()}@example.com`;
    try {
      await page.goto("/register");
      await page.fill("#name", "E2E Tester");
      await page.fill("#email", email);
      await page.fill("#password", "TestPass123!");
      await page.fill("#confirmPassword", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Create account")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.goto("/settings");
      for (const name of DEFAULT_CATEGORIES) {
        await expect(page.locator("li", { hasText: name })).toBeVisible();
      }
    } finally {
      await deleteTestUser(email);
    }
  });

  test("add, edit, and delete a category, each with a confirmation toast", async ({ page }) => {
    const email = `e2e-categories-crud-${Date.now()}@example.com`;
    try {
      await page.goto("/register");
      await page.fill("#name", "E2E Tester");
      await page.fill("#email", email);
      await page.fill("#password", "TestPass123!");
      await page.fill("#confirmPassword", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Create account")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.goto("/settings");
      await page.click('button:has-text("Add category")');
      await page.fill("#name", "E2E Test Category");
      await page.click('button[type="submit"]:has-text("Add category")');
      await expect(page.locator("[data-sonner-toast]", { hasText: "Category added" })).toBeVisible();
      await expect(page.locator("li", { hasText: "E2E Test Category" })).toBeVisible();

      const row = page.locator("li", { hasText: "E2E Test Category" });
      await row.locator("button[aria-haspopup]").click();
      await page.click('[role="menuitem"]:has-text("Edit")');
      await page.fill("#name", "E2E Test Category (edited)");
      await page.click('button[type="submit"]:has-text("Save changes")');
      await expect(
        page.locator("[data-sonner-toast]", { hasText: "Category updated" }),
      ).toBeVisible();
      await expect(page.locator("li", { hasText: "E2E Test Category (edited)" })).toBeVisible();

      const editedRow = page.locator("li", { hasText: "E2E Test Category (edited)" });
      await editedRow.locator("button[aria-haspopup]").click();
      await page.click('[role="menuitem"]:has-text("Delete")');
      await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');
      await expect(
        page.locator("[data-sonner-toast]", { hasText: "Category deleted" }),
      ).toBeVisible();
      await expect(page.locator("li", { hasText: "E2E Test Category (edited)" })).toHaveCount(0);
    } finally {
      await deleteTestUser(email);
    }
  });
});
