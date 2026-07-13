import { cn } from "@lib/utils";

/**
 * Two-layer "clipped border" — `clip-path` alone can cut a box's silhouette
 * but it can't bend a plain `border` onto the new diagonal edges it creates,
 * so a `border` on a `.corner-cut` element just stops dead at the cut
 * corners. This renders an outer `.corner-cut` layer filled with the border
 * color, padded by `width`, wrapping an inner `.corner-cut` layer (same cut)
 * that shows the real background — so the border consistently follows the
 * cut, including the diagonals.
 */
export function CornerCutBorder({
  borderClassName = "bg-border",
  width = 1,
  className,
  contentClassName,
  children,
}: {
  /** Tailwind bg-* class for the border color, e.g. "bg-primary/40". */
  borderClassName?: string;
  width?: number;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("corner-cut", borderClassName, className)}
      style={{ padding: width }}
    >
      <div className={cn("corner-cut size-full", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
