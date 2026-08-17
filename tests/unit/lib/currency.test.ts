import { describe, expect, it } from "vitest";
import { convertCents, type Currency } from "@/lib/currency";

const rates: Record<Currency, number> = { USD: 1, EGP: 50, EUR: 0.92 };

describe("convertCents", () => {
  it("returns the amount unchanged when from and to match, regardless of rates", () => {
    expect(convertCents(1234, "EGP", "EGP", rates)).toBe(1234);
  });

  it("converts via USD as the pivot", () => {
    // 5000 EGP cents -> 100 USD cents -> 92 EUR cents
    expect(convertCents(5000, "EGP", "EUR", rates)).toBe(92);
  });

  it("converts from USD to a foreign currency", () => {
    // 100 USD cents -> 5000 EGP cents
    expect(convertCents(100, "USD", "EGP", rates)).toBe(5000);
  });

  it("rounds to the nearest cent instead of truncating", () => {
    // 1 EGP cent -> 0.02 USD cents -> rounds to 0
    expect(convertCents(1, "EGP", "USD", rates)).toBe(0);
    // 3 EGP cents -> 0.06 USD cents -> rounds to 0, but 30 -> 0.6 -> rounds to 1
    expect(convertCents(30, "EGP", "USD", rates)).toBe(1);
  });
});
