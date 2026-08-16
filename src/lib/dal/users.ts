import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";
import type { Currency } from "@/lib/exchange-rates";

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
