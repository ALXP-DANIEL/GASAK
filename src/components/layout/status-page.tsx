"use client";

import { cn } from "@lib/utils";
import Link from "next/link";
import { Button } from "../ui/shadcn/button";

type StatusPageAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onAction?: () => void | Promise<void>;
};

type StatusPageProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: StatusPageAction[];
  className?: string;
};

const actionClassNames: Record<
  NonNullable<StatusPageAction["variant"]>,
  string
> = {
  primary: "text-foreground hover:bg-[var(--glass-active)]",
  secondary: "text-foreground hover:bg-[var(--glass-active)]",
  ghost:
    "text-muted-foreground shadow-none hover:bg-[var(--glass-active)] hover:text-foreground",
  danger:
    "text-destructive shadow-none hover:bg-[var(--glass-active)] hover:text-destructive-foreground",
};

export default function StatusPage({
  code,
  eyebrow,
  title,
  description,
  actions = [],
  className,
}: StatusPageProps) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-1 items-center justify-center px-4 py-10 desktop:px-8",
        className,
      )}
    >
      <div className="grid w-full gap-8 desktop:items-center">
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </span>

          <p className="mt-4 text-[4.5rem] leading-none font-semibold tracking-[-0.08em] text-primary desktop:text-[5.5rem]">
            {code}
          </p>

          <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground desktop:text-base">
            {description}
          </p>

          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {actions.map(({ href, label, variant = "primary", onAction }) => {
                const buttonClassName = cn(
                  "glass rounded-full px-4",
                  actionClassNames[variant],
                );

                if (onAction) {
                  return (
                    <Button
                      key={`${href}-${label}`}
                      type="button"
                      className={buttonClassName}
                      onClick={onAction}
                    >
                      {label}
                    </Button>
                  );
                }

                return (
                  <Button
                    key={`${href}-${label}`}
                    className={buttonClassName}
                    render={<Link href={href}>{label}</Link>}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
