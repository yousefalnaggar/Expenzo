import { describe, expect, it } from "vitest";
import { categorySchema } from "@/lib/validations/category";

describe("categorySchema", () => {
  const valid = { name: "Food", color: "#f97316" };

  it("accepts valid input", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(categorySchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects a name over 50 characters", () => {
    expect(categorySchema.safeParse({ ...valid, name: "a".repeat(51) }).success).toBe(false);
  });

  it("rejects a non-hex color", () => {
    expect(categorySchema.safeParse({ ...valid, color: "orange" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, color: "#fff" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, color: "f97316" }).success).toBe(false);
  });

  it("accepts a 6-digit hex color", () => {
    expect(categorySchema.safeParse({ ...valid, color: "#000000" }).success).toBe(true);
  });
});
