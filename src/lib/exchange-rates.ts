import "server-only";

export type Currency = "USD" | "EGP" | "EUR";

// Fallback only — used when the live API is unreachable or misconfigured, so
// the app never hard-fails just because an external service hiccuped.
const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  EGP: 49,
  EUR: 0.92,
};

export async function getExchangeRate(target: Currency): Promise<number> {
  if (target === "USD") return 1;

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    console.warn("EXCHANGE_RATE_API_KEY is not set; using fallback exchange rate.");
    return FALLBACK_RATES[target];
  }

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/${target}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Exchange rate API responded with ${res.status}`);

    const data: unknown = await res.json();
    const rate =
      typeof data === "object" && data !== null && "conversion_rate" in data
        ? (data as { conversion_rate: unknown }).conversion_rate
        : undefined;

    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error("Exchange rate API response missing a valid conversion_rate");
    }
    return rate;
  } catch (error) {
    console.warn(`Falling back to a static exchange rate for ${target}:`, error);
    return FALLBACK_RATES[target];
  }
}
