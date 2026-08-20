"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import {
  currencySchema,
  profileSchema,
  avatarSchema,
  passwordChangeSchema,
} from "@/lib/validations/user";
import {
  updateUserCurrency,
  getUserProfile,
  updateUserProfile,
  getUserPasswordHash,
  updateUserPasswordHash,
  removeUserAvatar,
  isCurrentUserDemo,
} from "@/lib/dal/users";
import { ensureAvatarBucket, uploadAvatar, deleteAvatar } from "@/lib/storage";
import { unstable_update } from "@/auth";
import { DEMO_LOCK_ERROR } from "@/lib/demo";

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const DUPLICATE_EMAIL_ERROR = "An account with this email already exists.";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function updateCurrency(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (await isCurrentUserDemo()) return { ok: false, error: DEMO_LOCK_ERROR };

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

export async function updateProfile(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getUserProfile();
  if (profile.isDemo) return { ok: false, error: DEMO_LOCK_ERROR };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Google-only accounts (no password) have no email-based login of their
  // own to protect — the OAuth link is keyed by Google's account id, not
  // email — but letting it drift from the real Google email is confusing
  // and can squat an email another person would otherwise register with.
  // Enforced here too, not just disabled in the UI (same reasoning as the
  // demo-account lock: a disabled input isn't a real gate).
  if (!profile.hasPassword && parsed.data.email !== profile.email) {
    return {
      ok: false,
      error: "Email is managed by your Google account and can't be changed here.",
      fieldErrors: { email: ["Managed by your Google account"] },
    };
  }

  const avatarFile = formData.get("avatar");
  let image: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const avatarParsed = avatarSchema.safeParse(avatarFile);
    if (!avatarParsed.success) {
      return {
        ok: false,
        error: avatarParsed.error.issues[0]?.message ?? "Invalid image.",
        fieldErrors: { avatar: [avatarParsed.error.issues[0]?.message ?? "Invalid image."] },
      };
    }

    try {
      await ensureAvatarBucket();
      image = await uploadAvatar(profile.id, avatarParsed.data);
      if (profile.image) await deleteAvatar(profile.image);
    } catch {
      return { ok: false, error: "Couldn't upload photo. Please try again." };
    }
  }

  try {
    await updateUserProfile({ ...parsed.data, ...(image ? { image } : {}) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: DUPLICATE_EMAIL_ERROR };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Best-effort: the DB write above already succeeded, so the profile
  // update is real regardless of this outcome. This only refreshes the
  // current device's session cookie so the UI reflects it without a
  // re-login (the navbar/dashboard read the DB directly on next request
  // either way) — not worth failing the whole action over.
  try {
    await unstable_update({
      user: { name: parsed.data.name, email: parsed.data.email, ...(image ? { image } : {}) },
    });
  } catch {
    // Ignore — see comment above.
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (await isCurrentUserDemo()) return { ok: false, error: DEMO_LOCK_ERROR };

  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const currentHash = await getUserPasswordHash();
  const valid = currentHash && (await bcrypt.compare(parsed.data.currentPassword, currentHash));
  if (!valid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await updateUserPasswordHash(newHash);

  return { ok: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  if (await isCurrentUserDemo()) return { ok: false, error: DEMO_LOCK_ERROR };

  const profile = await getUserProfile();
  if (profile.image) await deleteAvatar(profile.image);
  await removeUserAvatar();

  try {
    await unstable_update({ user: { image: null } });
  } catch {
    // Best-effort — see comment in updateProfile.
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
