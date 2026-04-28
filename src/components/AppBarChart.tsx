"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type ExpenseCategory = {
  category: string;
  total: number;
};

const chartConfig = {
  total: {
    label: "Expenses",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppBarChart = ({ data }: { data: ExpenseCategory[] }) => {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No expense data yet.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-50 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(v) => (v.length > 10 ? v.slice(0, 10) + "…" : v)}
        />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: any) => `Rs ${Number(value).toLocaleString()}`}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
};

export default AppBarChart;
