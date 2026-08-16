import "server-only";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";
import { getCategories } from "@/lib/dal/categories";

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
    sortBy?: "date" | "amount";
    sortOrder?: "asc" | "desc";
  } = {},
) {
  const userId = await requireUserId();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const sortBy = filters.sortBy ?? "date";
  const sortOrder = filters.sortOrder ?? "desc";

  const where = {
    userId,
    ...(filters.from || filters.to ? { date: { gte: filters.from, lte: filters.to } } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? { description: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const orderBy = sortBy === "amount" ? { amountCents: sortOrder } : { date: sortOrder };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy,
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

export async function hasAnyExpenses(): Promise<boolean> {
  const userId = await requireUserId();
  const expense = await prisma.expense.findFirst({ where: { userId }, select: { id: true } });
  return expense !== null;
}

export async function getDashboardSummary() {
  const userId = await requireUserId();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amountCents: true },
    }),
  ]);

  const totalThisMonthCents = thisMonth._sum.amountCents ?? 0;
  const totalLastMonthCents = lastMonth._sum.amountCents ?? 0;
  const transactionCount = thisMonth._count;
  const dayOfMonth = now.getDate();
  const avgPerDayCents = Math.round(totalThisMonthCents / dayOfMonth);
  const percentVsLastMonth =
    totalLastMonthCents === 0
      ? null
      : ((totalThisMonthCents - totalLastMonthCents) / totalLastMonthCents) * 100;

  return { totalThisMonthCents, transactionCount, avgPerDayCents, percentVsLastMonth };
}

const UNCATEGORIZED_COLOR = "#64748b";

export async function getSpendByCategory() {
  const userId = await requireUserId();
  const now = new Date();

  const [grouped, categories] = await Promise.all([
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { amountCents: true },
    }),
    getCategories(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((group) => {
      const category = group.categoryId ? categoryById.get(group.categoryId) : undefined;
      return {
        categoryId: group.categoryId,
        name: category?.name ?? "Uncategorized",
        color: category?.color ?? UNCATEGORIZED_COLOR,
        totalCents: group._sum.amountCents ?? 0,
      };
    })
    .filter((group) => group.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents);
}

export async function getMonthlyTrend() {
  const userId = await requireUserId();
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 5));

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: rangeStart } },
    select: { date: true, amountCents: true },
  });

  const buckets = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(now, 5 - i);
    return { key: format(monthDate, "yyyy-MM"), label: format(monthDate, "MMM"), totalCents: 0 };
  });
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  for (const expense of expenses) {
    const key = format(expense.date, "yyyy-MM");
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.totalCents += expense.amountCents;
  }

  return buckets;
}
