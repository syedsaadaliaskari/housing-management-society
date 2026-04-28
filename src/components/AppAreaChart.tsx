"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type MonthlyPayment = {
  month: string;
  collected: number;
  outstanding: number;
};

const chartConfig = {
  collected: {
    label: "Collected",
    color: "var(--chart-2)",
  },
  outstanding: {
    label: "Outstanding",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppAreaChart = ({ data }: { data: MonthlyPayment[] }) => {
  return (
    <ChartContainer config={chartConfig} className="min-h-50 w-full">
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
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
        <ChartLegend content={<ChartLegendContent />} />
        <defs>
          <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-collected)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-collected)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-outstanding)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-outstanding)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="outstanding"
          type="natural"
          fill="url(#fillOutstanding)"
          fillOpacity={0.4}
          stroke="var(--color-outstanding)"
          stackId="a"
        />
        <Area
          dataKey="collected"
          type="natural"
          fill="url(#fillCollected)"
          fillOpacity={0.4}
          stroke="var(--color-collected)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default AppAreaChart;
