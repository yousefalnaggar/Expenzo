"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type CategorySlice = { categoryId: string | null; name: string; color: string; totalCents: number };

export function SpendByCategoryChart({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Spend by category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No spending recorded this month yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Spend by category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="totalCents"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((slice) => (
                  <Cell key={slice.categoryId ?? "uncategorized"} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {data.map((slice) => (
            <li key={slice.categoryId ?? "uncategorized"}>
              {slice.name}: {formatCurrency(slice.totalCents, currency)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
