import { z } from "zod";

export const currencySchema = z.object({
  currency: z.enum(["USD", "EGP", "EUR"]),
});
export type CurrencyInput = z.infer<typeof currencySchema>;
