"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type MonthBucket = { key: string; label: string; totalCents: number };

export function MonthlyTrendChart({ data, currency }: { data: MonthBucket[]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">6-month trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value: number) => formatCurrency(value, currency)}
                width={72}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Line
                type="monotone"
                dataKey="totalCents"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {data.map((bucket) => (
            <li key={bucket.key}>
              {bucket.label}: {formatCurrency(bucket.totalCents, currency)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
