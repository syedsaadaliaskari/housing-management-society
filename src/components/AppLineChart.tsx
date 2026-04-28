"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

type MonthlyPayment = {
  month: string;
  total: number;
};

const chartConfig = {
  total: {
    label: "Payments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppLineChart = ({ data }: { data: MonthlyPayment[] }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No payment history yet.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mt-4 min-h-50 w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value: any) => `Rs ${Number(value).toLocaleString()}`}
            />
          }
        />
        <Line
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};

export default AppLineChart;
