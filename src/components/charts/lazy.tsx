"use client";

import { Skeleton } from "@components/ui/shadcn/skeleton";
import dynamic from "next/dynamic";

/**
 * Recharts is ~100kB of client JS. These lazy variants keep it out of the
 * initial bundle for pages that render charts below the fold; the reserved
 * skeleton height prevents layout shift when the chart mounts.
 */

const chartFallback = <Skeleton className="h-64 w-full" />;

export const RevenueTrendChart = dynamic(
  () => import("./revenue-trend-chart").then((mod) => mod.RevenueTrendChart),
  { ssr: false, loading: () => chartFallback },
);

export const SquadBarChart = dynamic(
  () => import("./squad-bar-chart").then((mod) => mod.SquadBarChart),
  { ssr: false, loading: () => chartFallback },
);

export type { RevenuePoint } from "./revenue-trend-chart";
