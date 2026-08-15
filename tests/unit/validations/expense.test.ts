import { describe, expect, it } from "vitest";
import { expenseSchema } from "@/lib/validations/expense";

describe("expenseSchema", () => {
  const valid = {
    description: "Coffee",
    amount: "4.50",
    date: "2024-01-01",
    categoryId: "",
    note: "",
  };

  it("accepts valid input", () => {
    expect(expenseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty description", () => {
    const result = expenseSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a description over 120 characters", () => {
    const result = expenseSchema.safeParse({ ...valid, description: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative amount", () => {
    expect(expenseSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, amount: "-5" }).success).toBe(false);
  });

  it("rejects an amount over 1,000,000", () => {
    const result = expenseSchema.safeParse({ ...valid, amount: "1000001" });
    expect(result.success).toBe(false);
  });

  it("rejects a future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = expenseSchema.safeParse({ ...valid, date: future.toISOString() });
    expect(result.success).toBe(false);
  });

  it("accepts today's date", () => {
    const result = expenseSchema.safeParse({ ...valid, date: new Date().toISOString() });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed categoryId", () => {
    const result = expenseSchema.safeParse({ ...valid, categoryId: "not-a-cuid" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty categoryId (uncategorized)", () => {
    const result = expenseSchema.safeParse({ ...valid, categoryId: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a note over 500 characters", () => {
    const result = expenseSchema.safeParse({ ...valid, note: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});
