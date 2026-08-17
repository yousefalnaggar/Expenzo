import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as expensesDal from "@/lib/dal/expenses";
import * as categoriesDal from "@/lib/dal/categories";

// requireUserId() (src/lib/dal/session.ts) calls auth() — mock it so each
// test can act as whichever user it needs without a real HTTP session.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { auth } = await import("@/auth");
const mockedAuth = vi.mocked(auth);

function actAs(userId: string) {
  mockedAuth.mockResolvedValue({
    user: { id: userId },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } as never);
}

// This is the cross-user auth test CLAUDE.md calls non-negotiable (Security
// Rule #1): every DAL query must be scoped by userId, so an "attacker" who
// somehow gets hold of another user's row id — e.g. a tampered Server Action
// payload — still can't read or mutate it. The UI never offers a way to even
// attempt this (no user ever sees another user's id), so this can only be
// tested at the layer where the real defense lives, not through the browser.
describe("DAL cross-user ownership", () => {
  const runId = Date.now();
  const ownerEmail = `test-owner-${runId}@example.com`;
  const attackerEmail = `test-attacker-${runId}@example.com`;
  let ownerId: string;
  let attackerId: string;
  let ownerExpenseId: string;
  let ownerCategoryId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { email: ownerEmail, name: "Owner", passwordHash: "unused" },
    });
    const attacker = await prisma.user.create({
      data: { email: attackerEmail, name: "Attacker", passwordHash: "unused" },
    });
    ownerId = owner.id;
    attackerId = attacker.id;

    const category = await prisma.category.create({
      data: { name: "Owner's category", color: "#123456", userId: ownerId },
    });
    ownerCategoryId = category.id;

    const expense = await prisma.expense.create({
      data: {
        amountCents: 5000,
        currency: "USD",
        normalizedUsdCents: 5000,
        description: "Owner's expense",
        date: new Date(),
        userId: ownerId,
        categoryId: ownerCategoryId,
      },
    });
    ownerExpenseId = expense.id;
  });

  afterAll(async () => {
    // Cascades expenses/categories per the schema's onDelete: Cascade.
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, attackerId] } } });
  });

  beforeEach(() => {
    mockedAuth.mockReset();
  });

  it("never lets another user read the expense by id", async () => {
    actAs(attackerId);
    await expect(expensesDal.getExpenseById(ownerExpenseId)).resolves.toBeNull();
  });

  it("never lets another user update the expense", async () => {
    actAs(attackerId);
    await expect(
      expensesDal.updateExpense(ownerExpenseId, {
        amountCents: 999_999,
        currency: "USD",
        normalizedUsdCents: 999_999,
        description: "hijacked",
        date: new Date(),
      }),
    ).rejects.toThrow("NOT_FOUND");

    actAs(ownerId);
    const stillOwners = await expensesDal.getExpenseById(ownerExpenseId);
    expect(stillOwners?.description).toBe("Owner's expense");
    expect(stillOwners?.amountCents).toBe(5000);
  });

  it("never lets another user delete the expense", async () => {
    actAs(attackerId);
    await expect(expensesDal.deleteExpense(ownerExpenseId)).rejects.toThrow("NOT_FOUND");

    actAs(ownerId);
    await expect(expensesDal.getExpenseById(ownerExpenseId)).resolves.not.toBeNull();
  });

  it("never lets another user update the category", async () => {
    actAs(attackerId);
    await expect(
      categoriesDal.updateCategory(ownerCategoryId, { name: "hijacked", color: "#000000" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("never lets another user delete the category", async () => {
    actAs(attackerId);
    await expect(categoriesDal.deleteCategory(ownerCategoryId)).rejects.toThrow("NOT_FOUND");
  });

  it("lets the actual owner read, update, and delete their own data", async () => {
    actAs(ownerId);
    await expect(expensesDal.getExpenseById(ownerExpenseId)).resolves.not.toBeNull();

    await expensesDal.updateExpense(ownerExpenseId, {
      amountCents: 7500,
      currency: "USD",
      normalizedUsdCents: 7500,
      description: "Owner's expense, edited",
      date: new Date(),
    });
    const updated = await expensesDal.getExpenseById(ownerExpenseId);
    expect(updated?.amountCents).toBe(7500);

    await expensesDal.deleteExpense(ownerExpenseId);
    await expect(expensesDal.getExpenseById(ownerExpenseId)).resolves.toBeNull();
  });
});
