"use client";

import { Skeleton } from "@components/ui/shadcn/skeleton";
import dynamic from "next/dynamic";

/**
 * FullCalendar is one of the heaviest client bundles in the app and is
 * useless during SSR — load it only in the browser, behind a skeleton,
 * so the schedules page shell paints immediately.
 */
export const ScheduleCalendar = dynamic(
  () => import("./schedule-calendar").then((mod) => mod.ScheduleCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-56" />
        </div>
        <Skeleton className="h-[34rem] w-full" />
      </div>
    ),
  },
);
