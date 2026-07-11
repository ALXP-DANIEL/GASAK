import { AnimatedNumber } from "@components/motion/animated-number";
import { cn } from "@lib/utils";
import type { Icon } from "@phosphor-icons/react";

/**
 * Dense horizontal stat band — the HUD readout row under a page header.
 * 2-up on mobile, one row on desktop, divided by shared borders.
 */
export function StatStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden border bg-card shadow-xs desktop:auto-cols-fr desktop:grid-flow-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatItem({
  label,
  value,
  hint,
  icon: StatIcon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: Icon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mt-px -ml-px group relative flex flex-col gap-1.5 border-t border-l px-4 py-3.5 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 h-0.5 w-8 -skew-x-12 bg-primary/0 transition-colors group-hover:bg-primary"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span
            aria-hidden
            className="h-2.5 w-0.75 shrink-0 -skew-x-12 bg-primary/70"
          />
          <span className="truncate">{label}</span>
        </span>
        {StatIcon && (
          <StatIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground/50"
            weight="duotone"
          />
        )}
      </div>
      <span className="font-heading text-[1.7rem] font-bold leading-none tracking-normal tabular-nums">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </span>
      {hint && (
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
