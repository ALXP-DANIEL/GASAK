import { cn } from "@lib/utils";

const asideWidths = {
  /** 22rem side column — settings, squad detail, my-squad. */
  sm: "desktop:grid-cols-[minmax(0,1fr)_22rem]",
  /** 24rem side column — product detail, news detail. */
  md: "desktop:grid-cols-[minmax(0,1fr)_24rem]",
} as const;

/**
 * Master–detail shell: main content with a fixed-width side column on
 * desktop, stacked (aside last) on mobile.
 */
export function SplitView({
  children,
  aside,
  asideWidth = "sm",
  className,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  asideWidth?: keyof typeof asideWidths;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6", asideWidths[asideWidth], className)}>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <div className="flex min-w-0 flex-col gap-6">{aside}</div>
    </div>
  );
}
