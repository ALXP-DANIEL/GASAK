import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";

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
    <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <StatIcon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-3xl font-medium leading-none tracking-tight tabular-nums">
          {value}
        </div>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
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
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
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
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            {action.label}
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
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
    "flex items-center justify-between gap-3 rounded-md px-2 py-2";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(itemClass, "transition-colors hover:bg-muted")}
      >
        {content}
      </Link>
    );
  }

  return <div className={itemClass}>{content}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
