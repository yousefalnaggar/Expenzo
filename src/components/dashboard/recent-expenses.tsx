import Link from "next/link";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { convertCents, type Currency } from "@/lib/currency";

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: { category: true } }>;

export function RecentExpenses({
  expenses,
  currency,
  rates,
}: {
  expenses: ExpenseRow[];
  currency: Currency;
  rates: Record<Currency, number>;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">Recent expenses</CardTitle>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/expenses" />}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No expenses yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {expenses.map((expense) => {
              const converted = convertCents(
                expense.amountCents,
                expense.currency as Currency,
                currency,
                rates,
              );
              return (
                <li key={expense.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: expense.category?.color ?? "#64748b" }}
                    />
                    <span>{expense.description}</span>
                    <span className="text-muted-foreground">{format(expense.date, "MMM d")}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(converted, currency)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
