import { cn } from "@lib/utils";
import type { Icon } from "@phosphor-icons/react";
import { BreadcrumbLabelSync } from "./breadcrumb-label-sync";

/**
 * Skewed accent tick placed before uppercase micro-labels — the smallest
 * unit of the GASAK HUD language. Shared by headers, panels, and stats.
 */
export function AccentTick({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("h-3.5 w-1 shrink-0 -skew-x-12 bg-primary", className)}
    />
  );
}

export function PageHeader({
  title,
  description,
  kicker = "Dashboard",
  icon: HeaderIcon,
  actions,
  children,
  breadcrumbLabel,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Module group shown above the title, e.g. "Competition". */
  kicker?: string;
  /** Module icon rendered in a corner-cut tile beside the title. */
  icon?: Icon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * On a detail page (e.g. `/dashboard/players/[playerId]`), the record's
   * display name — shown in the breadcrumb trail instead of the raw id.
   */
  breadcrumbLabel?: string;
}) {
  const headerActions = actions ?? children;

  return (
    <header className="relative mb-6 border-b pb-5">
      {breadcrumbLabel && <BreadcrumbLabelSync label={breadcrumbLabel} />}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute -inset-x-2 -top-2 bottom-0 opacity-40"
      />
      <div className="relative flex flex-col gap-4 desktop:flex-row desktop:items-end desktop:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {HeaderIcon && (
            <div
              aria-hidden
              className="corner-cut hidden size-12 shrink-0 place-items-center border border-primary/40 bg-primary/10 text-primary desktop:grid"
            >
              <HeaderIcon className="size-6" weight="duotone" />
            </div>
          )}
          <div className="grid min-w-0 gap-1">
            <div className="flex items-center gap-2">
              <AccentTick className="h-2.5 w-0.75" />
              <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
                {kicker}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold leading-none tracking-normal desktop:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {headerActions && (
          <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div>
        )}
      </div>
    </header>
  );
}

/**
 * Standard content panel — bordered section with an accent-ticked header
 * strip. The single panel look shared across every dashboard module.
 */
export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden border bg-card shadow-xs",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
            <AccentTick className="h-3 w-0.75" />
            <span className="truncate">{title}</span>
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("flex-1 p-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  message,
  icon: EmptyIcon,
  action,
}: {
  message: string;
  icon?: Icon;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative grid place-items-center overflow-hidden border border-dashed px-4 py-10 text-center">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative grid justify-items-center gap-2">
        {EmptyIcon && (
          <EmptyIcon
            aria-hidden
            className="size-6 text-muted-foreground/60"
            weight="duotone"
          />
        )}
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
