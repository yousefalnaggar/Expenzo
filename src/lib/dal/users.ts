import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";
import type { Currency } from "@/lib/currency";
import { isDemoEmail } from "@/lib/demo";

// Registration/login run before a session exists, so these two functions are
// the deliberate exception to "every DAL function calls requireUserId() first".

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export async function createUser(input: { name: string; email: string; passwordHash: string }) {
  return prisma.user.create({
    data: input,
    select: { id: true, name: true, email: true, image: true },
  });
}

export async function getUserPreferredCurrency(): Promise<Currency> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { preferredCurrency: true },
  });
  return user.preferredCurrency as Currency;
}

export async function updateUserCurrency(currency: Currency) {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { preferredCurrency: currency },
  });
}

export async function getUserProfile() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, passwordHash: true },
  });
  const { passwordHash, ...profile } = user;
  return {
    ...profile,
    hasPassword: passwordHash !== null,
    isDemo: isDemoEmail(user.email),
  };
}

// Cheap standalone check for Server Actions that don't otherwise need the
// full profile (e.g. password/currency changes) — avoids selecting more
// columns than necessary just to guard against editing the shared demo account.
export async function isCurrentUserDemo(): Promise<boolean> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  return isDemoEmail(user.email);
}

export async function updateUserProfile(input: { name: string; email: string; image?: string }) {
  const userId = await requireUserId();
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, name: true, email: true, image: true },
  });
}

// Only ever called from the password-change Server Action — the hash never
// leaves that boundary (CLAUDE.md Security Rule #6).
export async function getUserPasswordHash(): Promise<string | null> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return user.passwordHash;
}

export async function updateUserPasswordHash(passwordHash: string) {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// Distinct from updateUserProfile's optional `image` — that one only ever
// sets a new value when provided, it can't clear the field back to null.
export async function removeUserAvatar() {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
}
