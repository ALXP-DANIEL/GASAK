import { cn } from "@lib/utils";

/**
 * Dense horizontal stat band — the compact alternative to a grid of big
 * stat cards. 2-up on mobile, one row on desktop, divided by borders.
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
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mt-px -ml-px flex flex-col gap-1 border-t border-l px-4 py-3",
        className,
      )}
    >
      <span className="truncate text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-medium leading-none tracking-tight tabular-nums">
        {value}
      </span>
      {hint && (
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
