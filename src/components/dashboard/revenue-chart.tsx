"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRM } from "@/lib/format";

export type RevenuePoint = { day: string; revenueSen: number };
export type ProductSalesPoint = {
  name: string;
  quantity: number;
  revenueSen: number;
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `RM${Math.round(v / 100)}`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value) => [formatRM(Number(value)), "Revenue"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar
            dataKey="revenueSen"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SellerRevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="sellerRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `RM ${Math.round(v / 100)}`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip
            formatter={(value) => [formatRM(Number(value)), "Revenue"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.45 }}
          />
          <Area
            type="monotone"
            dataKey="revenueSen"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#sellerRevenue)"
            activeDot={{ r: 4, fill: "var(--chart-1)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const PRODUCT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ProductSalesDonutChart({
  data,
  totalOrders,
}: {
  data: ProductSalesPoint[];
  totalOrders: number;
}) {
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="quantity"
              nameKey="name"
              innerRadius={66}
              outerRadius={98}
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.name}
                  fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => [
                `${value} sold`,
                entry.payload.name,
              ]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted-foreground">Total Sales</p>
          <p className="font-heading text-3xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">Orders</p>
        </div>
      </div>
      <div className="grid gap-2">
        {data.map((item, index) => {
          const percent =
            totalQuantity > 0
              ? Math.round((item.quantity / totalQuantity) * 100)
              : 0;
          return (
            <div
              key={item.name}
              className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm"
            >
              <p className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      PRODUCT_COLORS[index % PRODUCT_COLORS.length],
                  }}
                />
                <span className="truncate">{item.name}</span>
              </p>
              <p className="text-muted-foreground">
                {item.quantity} ({percent}%)
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
