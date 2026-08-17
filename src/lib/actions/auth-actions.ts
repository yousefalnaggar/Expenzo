"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { CredentialsSignin } from "next-auth";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { findUserByEmail, createUser } from "@/lib/dal/users";
import { seedDefaultCategories } from "@/lib/dal/categories";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const RATE_LIMIT_ERROR: ActionResult = {
  ok: false,
  error: "Too many attempts. Please try again in a minute.",
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!checkRateLimit(`register:${await clientIp()}`, 3, 60_000)) return RATE_LIMIT_ERROR;

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { name, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, passwordHash });
  await seedDefaultCategories(user.id);

  await signIn("credentials", { email, password, redirect: false });
  return { ok: true };
}

export async function loginUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!checkRateLimit(`login:${await clientIp()}`, 5, 60_000)) return RATE_LIMIT_ERROR;

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { ok: false, error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
