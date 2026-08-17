import { format } from "date-fns";
import { expect, test } from "@playwright/test";
import { deleteTestUser } from "./helpers/db";
import { fakeClientIp } from "./helpers/rate-limit-bypass";

test.use({ extraHTTPHeaders: { "x-forwarded-for": fakeClientIp("expenses-spec") } });

test.describe("expenses", () => {
  test("add, edit (date visible, not blank), and delete an expense", async ({ page }) => {
    const email = `e2e-expenses-crud-${Date.now()}@example.com`;
    try {
      await page.goto("/register");
      await page.fill("#name", "E2E Tester");
      await page.fill("#email", email);
      await page.fill("#password", "TestPass123!");
      await page.fill("#confirmPassword", "TestPass123!");
      await page.click('button[type="submit"]:has-text("Create account")');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.goto("/expenses");
      await page.click('button:has-text("Add expense")');

      // The date field must default to today, not sit blank — a native
      // date input silently renders empty if handed anything but a
      // "yyyy-MM-dd" string.
      const today = format(new Date(), "yyyy-MM-dd");
      await expect(page.locator("#date")).toHaveValue(today);

      await page.fill("#description", "E2E Test Expense");
      await page.fill("#amount", "25.50");
      await page.click('button[type="submit"]:has-text("Add expense")');
      await expect(
        page.locator("[data-sonner-toast]", { hasText: "Expense added" }),
      ).toBeVisible();
      await expect(page.locator("tr", { hasText: "E2E Test Expense" })).toBeVisible();

      const row = page.locator("tr", { hasText: "E2E Test Expense" });
      await row.locator("button[aria-haspopup]").click();
      await page.click('[role="menuitem"]:has-text("Edit")');

      // The edit form must show the expense's real date, not a blank
      // mm/dd/yyyy field, and must be editable.
      await expect(page.locator("#date")).toHaveValue(today);

      await page.fill("#description", "E2E Test Expense (edited)");
      await page.click('button[type="submit"]:has-text("Save changes")');
      await expect(
        page.locator("[data-sonner-toast]", { hasText: "Expense updated" }),
      ).toBeVisible();
      await expect(page.locator("tr", { hasText: "E2E Test Expense (edited)" })).toBeVisible();

      const editedRow = page.locator("tr", { hasText: "E2E Test Expense (edited)" });
      await editedRow.locator("button[aria-haspopup]").click();
      await page.click('[role="menuitem"]:has-text("Delete")');
      await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');
      await expect(
        page.locator("[data-sonner-toast]", { hasText: "Expense deleted" }),
      ).toBeVisible();
      await expect(page.locator("tr", { hasText: "E2E Test Expense (edited)" })).toHaveCount(0);
    } finally {
      await deleteTestUser(email);
    }
  });
});
