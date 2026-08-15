import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";

// Filter params (from/to/categoryId/search) are accepted here so the DAL
// doesn't need reshaping in Phase 4 — the URL-based filter UI just needs to
// start passing them. Phase 3 callers pass none.
export async function getExpenses(
  filters: {
    from?: Date;
    to?: Date;
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const userId = await requireUserId();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where = {
    userId,
    ...(filters.from || filters.to ? { date: { gte: filters.from, lte: filters.to } } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? { description: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getExpenseById(id: string) {
  const userId = await requireUserId();
  return prisma.expense.findUnique({
    where: { id, userId },
    include: { category: true },
  });
}

export async function createExpense(input: {
  amountCents: number;
  description: string;
  date: Date;
  note?: string;
  categoryId?: string;
}) {
  const userId = await requireUserId();
  return prisma.expense.create({
    data: { ...input, userId },
  });
}

export async function updateExpense(
  id: string,
  input: {
    amountCents: number;
    description: string;
    date: Date;
    note?: string;
    categoryId?: string | null;
  },
) {
  const userId = await requireUserId();
  // updateMany scopes the WHERE by userId so a user can never mutate another
  // user's expense even if they guess/forge an id.
  const result = await prisma.expense.updateMany({
    where: { id, userId },
    data: input,
  });
  if (result.count === 0) throw new Error("NOT_FOUND");
}

export async function deleteExpense(id: string) {
  const userId = await requireUserId();
  const result = await prisma.expense.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("NOT_FOUND");
}
