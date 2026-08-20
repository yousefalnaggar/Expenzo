import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";

// Every new account starts with these instead of an empty list, so the app
// isn't a blank slate on first login. Applied at account-creation time only
// (see registerUser in auth-actions.ts and the `createUser` event in
// auth.ts for the Google OAuth path) — like createUser/findUserByEmail in
// dal/users.ts, this runs before a session exists, so it's the deliberate
// exception to "every DAL function calls requireUserId() first".
export const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#8b5cf6" },
  { name: "Utilities", color: "#14b8a6" },
  { name: "Food", color: "#f97316" },
  { name: "Transportation", color: "#3b82f6" },
  { name: "Healthcare", color: "#ef4444" },
  { name: "Personal/Lifestyle", color: "#ec4899" },
] as const;

export async function seedDefaultCategories(userId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId })),
  });
}

export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

// The @@unique([userId, name]) DB constraint is case-sensitive (Postgres
// default collation), so "food" and "Food" don't collide there — this check
// catches that case before it reaches the DB.
async function nameTakenByAnotherCategory(userId: string, name: string, excludeId?: string) {
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return existing !== null;
}

export async function createCategory(input: { name: string; color: string }) {
  const userId = await requireUserId();
  if (await nameTakenByAnotherCategory(userId, input.name)) {
    throw new Error("DUPLICATE_NAME");
  }
  return prisma.category.create({
    data: { ...input, userId },
  });
}

export async function updateCategory(id: string, input: { name: string; color: string }) {
  const userId = await requireUserId();
  if (await nameTakenByAnotherCategory(userId, input.name, id)) {
    throw new Error("DUPLICATE_NAME");
  }
  const result = await prisma.category.updateMany({
    where: { id, userId },
    data: input,
  });
  if (result.count === 0) throw new Error("NOT_FOUND");
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId();
  // The Expense.category relation is onDelete: SetNull, so this automatically
  // turns the category's expenses into "Uncategorized" rather than deleting them.
  const result = await prisma.category.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("NOT_FOUND");
}
