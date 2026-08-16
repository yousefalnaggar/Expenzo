import { describe, expect, it } from "vitest";
import { currencySchema } from "@/lib/validations/user";

describe("currencySchema", () => {
  it("accepts USD, EGP, and EUR", () => {
    expect(currencySchema.safeParse({ currency: "USD" }).success).toBe(true);
    expect(currencySchema.safeParse({ currency: "EGP" }).success).toBe(true);
    expect(currencySchema.safeParse({ currency: "EUR" }).success).toBe(true);
  });

  it("rejects an unsupported currency", () => {
    expect(currencySchema.safeParse({ currency: "GBP" }).success).toBe(false);
  });

  it("rejects a missing currency", () => {
    expect(currencySchema.safeParse({}).success).toBe(false);
  });
});
