"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { categorySchema } from "@/lib/validations/category";
import * as dal from "@/lib/dal/categories";

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const DUPLICATE_NAME_ERROR = "A category with this name already exists.";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createCategory(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await dal.createCategory(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: DUPLICATE_NAME_ERROR };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await dal.updateCategory(id, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: DUPLICATE_NAME_ERROR };
    }
    return { ok: false, error: "Category not found." };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await dal.deleteCategory(id);
  } catch {
    return { ok: false, error: "Category not found." };
  }

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { ok: true };
}
