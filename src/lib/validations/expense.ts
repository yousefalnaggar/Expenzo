import { z } from "zod";

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Required").max(120),
  amount: z.coerce.number().positive("Must be greater than 0").max(1_000_000),
  date: z.coerce.date().refine((d) => d.getTime() <= Date.now(), "Date can't be in the future"),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;
