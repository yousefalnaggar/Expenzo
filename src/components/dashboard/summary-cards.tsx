import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function SummaryCards({
  totalThisMonthCents,
  transactionCount,
  avgPerDayCents,
  percentVsLastMonth,
  currency,
}: {
  totalThisMonthCents: number;
  transactionCount: number;
  avgPerDayCents: number;
  percentVsLastMonth: number | null;
  currency: string;
}) {
  const trendLabel =
    percentVsLastMonth === null
      ? "—"
      : `${percentVsLastMonth > 0 ? "+" : ""}${percentVsLastMonth.toFixed(1)}%`;
  const trendColor =
    percentVsLastMonth === null
      ? "text-muted-foreground"
      : percentVsLastMonth > 0
        ? "text-destructive"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-normal">This month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(totalThisMonthCents, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-normal">vs last month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-semibold ${trendColor}`}>{trendLabel}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-normal">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{transactionCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-normal">Avg/day</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(avgPerDayCents, currency)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
