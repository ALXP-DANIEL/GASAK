"use client";

import { cn } from "@lib/utils";
import { motion, useReducedMotion } from "motion/react";

export type BarSegment = {
  label: string;
  value: number;
  /** CSS color, e.g. "var(--chart-1)". Fixed per entity — never reassigned. */
  color: string;
};

/**
 * Animated part-to-whole strip with a legend. Segments grow into place on
 * mount; identity is carried by the legend labels and counts, not color
 * alone. Zero-value segments stay in the legend so the scale is honest.
 */
export function SegmentedBar({
  title,
  segments,
  className,
}: {
  /** Accessible name, e.g. "Orders by status". */
  title: string;
  segments: BarSegment[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <div className={cn("grid gap-2.5", className)}>
      <div
        role="img"
        aria-label={`${title}: ${segments
          .map((segment) => `${segment.label} ${segment.value}`)
          .join(", ")}`}
        className="flex h-3 w-full gap-0.5"
      >
        {total === 0 ? (
          <div className="h-full w-full bg-muted" />
        ) : (
          visible.map((segment, index) => (
            <motion.div
              key={segment.label}
              title={`${segment.label}: ${segment.value}`}
              className="h-full min-w-1"
              style={{ backgroundColor: segment.color }}
              initial={reduceMotion ? false : { flexGrow: 0.001, opacity: 0.2 }}
              animate={{ flexGrow: segment.value, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 0.65, 0.3, 0.9],
              }}
            />
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden
              className="size-2.5 -skew-x-12"
              style={{ backgroundColor: segment.color }}
            />
            {segment.label}
            <span className="font-medium tabular-nums text-foreground">
              {segment.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
