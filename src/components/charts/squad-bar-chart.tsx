"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/shadcn/chart";

export type SquadBarPoint = {
  squad: string;
  value: number;
};

export function SquadBarChart({
  data,
  label,
}: {
  data: SquadBarPoint[];
  label: string;
}) {
  const chartConfig = {
    value: {
      label,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(160, data.length * 44) }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeOpacity={0.35} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          dataKey="squad"
          type="category"
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ChartContainer>
  );
}
