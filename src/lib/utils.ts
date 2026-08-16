import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// `amountCents` must already be in `currency` — convert with
// `convertCents()` (src/lib/exchange-rates.ts) first if it isn't.
export function formatCurrency(amountCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}
