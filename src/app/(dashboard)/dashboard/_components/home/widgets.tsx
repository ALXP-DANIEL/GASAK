import { Icons } from "@components/icons";
import { cn } from "@lib/utils";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { AccentTick } from "../page-surface";

export function StatCard({
  label,
  value,
  hint,
  icon: StatIcon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: Icon;
}) {
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden border bg-card p-4 shadow-xs transition-colors hover:bg-muted/40">
      <span
        aria-hidden
        className="absolute top-0 left-0 h-0.5 w-8 -skew-x-12 bg-primary/0 transition-colors group-hover:bg-primary"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <AccentTick className="h-2.5 w-0.75 bg-primary/70" />
          <span className="truncate">{label}</span>
        </span>
        <StatIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground/50"
          weight="duotone"
        />
      </div>
      <div className="font-heading text-3xl font-bold leading-none tabular-nums">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 desktop:grid-cols-4", className)}
    >
      {children}
    </div>
  );
}

export function HomePanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden border bg-card shadow-xs",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
            <AccentTick className="h-3 w-0.75" />
            <span className="truncate">{title}</span>
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group flex shrink-0 items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
          >
            {action.label}
            <Icons.Layout.Navigation.CaretRight
              aria-hidden
              className="size-3 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-1 p-3">{children}</div>
    </section>
  );
}

export function HomeListItem({
  title,
  meta,
  trailing,
  href,
}: {
  title: string;
  meta?: string;
  trailing?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta && (
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  );

  const itemClass =
    "flex items-center justify-between gap-3 border-l-2 border-transparent px-2.5 py-2";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          itemClass,
          "transition-colors hover:border-primary hover:bg-muted/50",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={itemClass}>{content}</div>;
}

export { EmptyState } from "../page-surface";
