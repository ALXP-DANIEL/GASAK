import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoWordmark = "full" | "compact" | "none";

/**
 * The GASAK brand mark: the circular esports logo plus an optional wordmark.
 * Shared across the public header/footer, dashboard sidebar, and auth pages
 * so the brand only needs to change in one place.
 */
export function Logo({
  size = 40,
  wordmark = "full",
  wordmarkClassName,
  href = "/",
  className,
}: {
  /** Pixel size of the logo image. */
  size?: number;
  /** "full" = stacked Gasak/Esport wordmark, "compact" = single-line GASAK, "none" = icon only. */
  wordmark?: LogoWordmark;
  wordmarkClassName?: string;
  /** Wraps the logo in a Link when set; pass null to render a plain span. */
  href?: string | null;
  className?: string;
}) {
  const content = (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/images/gasak-logo.png"
        alt="GASAK ESPORT logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
      {wordmark === "full" && (
        <span
          className={cn(
            "flex max-w-32 flex-col overflow-hidden leading-none whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear",
            wordmarkClassName,
          )}
        >
          <span className="font-heading text-lg font-bold uppercase tracking-widest text-primary">
            Gasak
          </span>
          <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            Esport
          </span>
        </span>
      )}
      {wordmark === "compact" && (
        <span
          className={cn(
            "max-w-24 overflow-hidden font-heading text-base font-semibold whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear",
            wordmarkClassName,
          )}
        >
          GASAK
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="flex items-center">
      {content}
    </Link>
  );
}
