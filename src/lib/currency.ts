// Pure, client-safe currency helpers — no secrets, no fetch. The live-rate
// fetching in exchange-rates.ts stays server-only (it uses an API key); this
// file holds the parts that Client Components (forms, tables) also need.

export type Currency = "USD" | "EGP" | "EUR";
export const CURRENCIES: Currency[] = ["USD", "EGP", "EUR"];

// Converts cents from one currency to another via USD as the pivot. Returns
// `amountCents` unchanged when `from === to` — no rate involved, no drift.
export function convertCents(
  amountCents: number,
  from: Currency,
  to: Currency,
  rates: Record<Currency, number>,
): number {
  if (from === to) return amountCents;
  const usdCents = amountCents / rates[from];
  return Math.round(usdCents * rates[to]);
}
