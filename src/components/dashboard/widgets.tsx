import type { Icon } from "@phosphor-icons/react";
import { BrandBadge, BrandCard } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Dashboard
        </p>
        <h1 className="mt-2 font-heading text-2xl font-black tracking-wide lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  Icon: StatIcon,
  hint,
}: {
  label: string;
  value: string | number;
  Icon: Icon;
  hint?: string;
}) {
  return (
    <BrandCard className="p-5">
      <div className="flex items-center gap-4">
        <div className="rounded border border-primary/35 bg-primary/10 p-2.5 text-primary">
          <StatIcon size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-2xl font-bold tracking-wide">
            {value}
          </p>
          <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
    </BrandCard>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-primary/25 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BrandCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold tracking-wide">
            {title}
          </h2>
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </BrandCard>
  );
}

export function DashboardListItem({
  title,
  description,
  badge,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/15 bg-background/35 p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        {description && (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
      {typeof badge === "string" ? <BrandBadge>{badge}</BrandBadge> : badge}
    </div>
  );
}
