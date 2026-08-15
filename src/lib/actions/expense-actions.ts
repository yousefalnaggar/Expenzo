"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { expenseSchema } from "@/lib/validations/expense";
import * as dal from "@/lib/dal/expenses";

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function toExpenseInput(formData: FormData) {
  return expenseSchema.safeParse(Object.fromEntries(formData));
}

export async function createExpense(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = toExpenseInput(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { amount, categoryId, ...rest } = parsed.data;

  try {
    await dal.createExpense({
      ...rest,
      amountCents: Math.round(amount * 100),
      categoryId: categoryId || undefined,
    });
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateExpense(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = toExpenseInput(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { amount, categoryId, ...rest } = parsed.data;

  try {
    await dal.updateExpense(id, {
      ...rest,
      amountCents: Math.round(amount * 100),
      categoryId: categoryId || null,
    });
  } catch {
    return { ok: false, error: "Expense not found." };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    await dal.deleteExpense(id);
  } catch {
    return { ok: false, error: "Expense not found." };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}
