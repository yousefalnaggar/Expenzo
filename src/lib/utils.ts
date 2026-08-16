import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// amountCents is always stored in USD; `rate` converts to the display currency.
export function formatCurrency(amountCents: number, currency = "USD", rate = 1): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    (amountCents * rate) / 100,
  );
}

// Inverse of formatCurrency's conversion: turns a decimal amount entered in
// the display currency back into USD cents for storage.
export function toUsdCents(displayAmount: number, rate: number): number {
  return Math.round((displayAmount / rate) * 100);
}
