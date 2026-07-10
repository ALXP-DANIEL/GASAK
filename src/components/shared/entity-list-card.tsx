import { cn } from "@lib/utils";
import Link from "next/link";

/**
 * Standard compact entity row for mobile card lists (DataTable's
 * `renderMobileCard`) and dashboard feeds. Renders as a link when `href`
 * is given.
 */
export function EntityListCard({
  title,
  meta,
  leading,
  trailing,
  href,
  className,
  children,
}: {
  title: React.ReactNode;
  /** Secondary line under the title. */
  meta?: React.ReactNode;
  /** Left slot — avatar, logo, icon, status dot. */
  leading?: React.ReactNode;
  /** Right slot — badge, chevron, action. */
  trailing?: React.ReactNode;
  href?: string;
  className?: string;
  /** Optional extra content below the title/meta block (full width). */
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{title}</div>
          {meta && (
            <div className="truncate text-xs text-muted-foreground">{meta}</div>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </>
  );

  const cardClass = cn(
    "block border bg-card px-4 py-3 shadow-xs",
    href && "transition-colors active:bg-muted/60 hover:bg-muted/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {body}
      </Link>
    );
  }
  return <div className={cardClass}>{body}</div>;
}
