import "server-only";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";
import { getCategories } from "@/lib/dal/categories";
import { convertCents, type Currency } from "@/lib/currency";

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

  // Sorting "by amount" uses normalizedUsdCents (a frozen USD-equivalent
  // captured at entry time — see createExpense), not the native amountCents,
  // so ordering stays correct across mixed currencies without needing a
  // live rate fetch or in-memory sort (which would break pagination).
  const orderBy = sortBy === "amount" ? { normalizedUsdCents: sortOrder } : { date: sortOrder };

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
  currency: Currency;
  normalizedUsdCents: number;
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
    currency: Currency;
    normalizedUsdCents: number;
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

export async function getDashboardSummary(
  displayCurrency: Currency,
  rates: Record<Currency, number>,
) {
  const userId = await requireUserId();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Expenses can be in different native currencies, so sums have to be
  // normalized in JS (convertCents) — a DB-level SUM would add raw cents
  // across currencies, which is meaningless.
  const [thisMonthRows, lastMonthRows] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
      select: { amountCents: true, currency: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      select: { amountCents: true, currency: true },
    }),
  ]);

  const sumIn = (rows: { amountCents: number; currency: string }[]) =>
    rows.reduce(
      (sum, row) =>
        sum + convertCents(row.amountCents, row.currency as Currency, displayCurrency, rates),
      0,
    );

  const totalThisMonthCents = sumIn(thisMonthRows);
  const totalLastMonthCents = sumIn(lastMonthRows);
  const transactionCount = thisMonthRows.length;
  const dayOfMonth = now.getDate();
  const avgPerDayCents = Math.round(totalThisMonthCents / dayOfMonth);
  const percentVsLastMonth =
    totalLastMonthCents === 0
      ? null
      : ((totalThisMonthCents - totalLastMonthCents) / totalLastMonthCents) * 100;

  return { totalThisMonthCents, transactionCount, avgPerDayCents, percentVsLastMonth };
}

const UNCATEGORIZED_COLOR = "#64748b";

export async function getSpendByCategory(
  displayCurrency: Currency,
  rates: Record<Currency, number>,
) {
  const userId = await requireUserId();
  const now = new Date();

  const [rows, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      select: { categoryId: true, amountCents: true, currency: true },
    }),
    getCategories(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const totalsByCategory = new Map<string | null, number>();
  for (const row of rows) {
    const converted = convertCents(
      row.amountCents,
      row.currency as Currency,
      displayCurrency,
      rates,
    );
    totalsByCategory.set(row.categoryId, (totalsByCategory.get(row.categoryId) ?? 0) + converted);
  }

  return Array.from(totalsByCategory.entries())
    .map(([categoryId, totalCents]) => {
      const category = categoryId ? categoryById.get(categoryId) : undefined;
      return {
        categoryId,
        name: category?.name ?? "Uncategorized",
        color: category?.color ?? UNCATEGORIZED_COLOR,
        totalCents,
      };
    })
    .filter((group) => group.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents);
}

export async function getMonthlyTrend(displayCurrency: Currency, rates: Record<Currency, number>) {
  const userId = await requireUserId();
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 5));

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: rangeStart } },
    select: { date: true, amountCents: true, currency: true },
  });

  const buckets = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(now, 5 - i);
    return { key: format(monthDate, "yyyy-MM"), label: format(monthDate, "MMM"), totalCents: 0 };
  });
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  for (const expense of expenses) {
    const key = format(expense.date, "yyyy-MM");
    const bucket = bucketByKey.get(key);
    if (bucket) {
      bucket.totalCents += convertCents(
        expense.amountCents,
        expense.currency as Currency,
        displayCurrency,
        rates,
      );
    }
  }

  return buckets;
}
