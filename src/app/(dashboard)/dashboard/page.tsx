import Link from "next/link";
import { auth } from "@/auth";
import {
  getDashboardSummary,
  getExpenses,
  getMonthlyTrend,
  getSpendByCategory,
  hasAnyExpenses,
} from "@/lib/dal/expenses";
import { getUserPreferredCurrency } from "@/lib/dal/users";
import { getExchangeRate, type Currency } from "@/lib/exchange-rates";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendByCategoryChart } from "@/components/dashboard/spend-by-category-chart";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";

export default async function DashboardPage() {
  const [session, hasExpenses] = await Promise.all([auth(), hasAnyExpenses()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Welcome, {session?.user?.name ?? "there"}</h1>
        <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
      </div>

      {hasExpenses ? (
        <DashboardContent />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No expenses yet. Add your first one to see your spending here.
          </p>
          <Button nativeButton={false} render={<Link href="/expenses" />}>
            Add an expense
          </Button>
        </div>
      )}
    </div>
  );
}

async function DashboardContent() {
  const currency = await getUserPreferredCurrency();
  const [summary, spendByCategory, monthlyTrend, { items: recentExpenses }, rate] =
    await Promise.all([
      getDashboardSummary(),
      getSpendByCategory(),
      getMonthlyTrend(),
      getExpenses({ pageSize: 5 }),
      getExchangeRate(currency as Currency),
    ]);

  return (
    <>
      <SummaryCards {...summary} currency={currency} rate={rate} />
      <div className="grid gap-4 md:grid-cols-2">
        <SpendByCategoryChart data={spendByCategory} currency={currency} rate={rate} />
        <MonthlyTrendChart data={monthlyTrend} currency={currency} rate={rate} />
      </div>
      <RecentExpenses expenses={recentExpenses} currency={currency} rate={rate} />
    </>
  );
}
