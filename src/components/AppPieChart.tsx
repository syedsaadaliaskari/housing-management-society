"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

type OwnershipItem = {
  ownership_status: string;
  count: number;
};

const COLORS: Record<string, string> = {
  OWNER: "var(--chart-1)",
  TENANT: "var(--chart-2)",
  BOTH: "var(--chart-3)",
};

const chartConfig = {
  OWNER: { label: "Owner", color: "var(--chart-1)" },
  TENANT: { label: "Tenant", color: "var(--chart-2)" },
  BOTH: { label: "Both", color: "var(--chart-3)" },
} satisfies ChartConfig;

const AppPieChart = ({ data }: { data: OwnershipItem[] }) => {
  const chartData = data.map((d) => ({
    name: d.ownership_status,
    value: d.count,
    fill: COLORS[d.ownership_status] ?? "var(--chart-4)",
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No member data yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-55"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            strokeWidth={4}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 22}
                        className="fill-muted-foreground text-xs"
                      >
                        Members
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ background: d.fill }}
            />
            <span className="text-xs text-muted-foreground">
              {d.name} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppPieChart;
