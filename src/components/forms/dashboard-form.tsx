"use client";

import { cn } from "@lib/utils";

export function DashboardForm({
  className,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      className={cn(
        "grid gap-5 rounded-lg border border-border/70 bg-muted/15 p-3 shadow-sm shadow-foreground/5",
        "[&>button[type=submit]:last-child]:sticky [&>button[type=submit]:last-child]:bottom-0 [&>button[type=submit]:last-child]:z-10 [&>button[type=submit]:last-child]:mt-1 [&>button[type=submit]:last-child]:shadow-lg [&>button[type=submit]:last-child]:shadow-foreground/15",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

export function DashboardFormSection({
  title,
  description,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-md border border-border/60 bg-background/75 p-3.5 shadow-inner shadow-foreground/2.5",
        className,
      )}
    >
      {(title || description) && (
        <div className="grid gap-1 border-b border-border/60 pb-3">
          {title && (
            <h3 className="font-heading text-base font-bold uppercase tracking-normal">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function DashboardFormGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "desktop:grid-cols-2",
        columns === 3 && "desktop:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardFormFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 desktop:flex-row desktop:items-center desktop:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
