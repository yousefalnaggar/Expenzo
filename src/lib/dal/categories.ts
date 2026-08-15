import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";

export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(input: { name: string; color: string }) {
  const userId = await requireUserId();
  return prisma.category.create({
    data: { ...input, userId },
  });
}

export async function updateCategory(id: string, input: { name: string; color: string }) {
  const userId = await requireUserId();
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
