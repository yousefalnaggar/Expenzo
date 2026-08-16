"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currencySchema } from "@/lib/validations/user";
import { updateUserCurrency } from "@/lib/dal/users";

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export async function updateCurrency(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = currencySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please choose a valid currency.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await updateUserCurrency(parsed.data.currency);

  revalidatePath("/", "layout");
  return { ok: true };
}
