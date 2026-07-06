import type { CSSProperties, ReactNode } from "react";

/**
 * Overrides the theme accent within its subtree using a squad's custom
 * accent color (hex). Renders children unchanged when no color is set.
 */
export function Accent({
  color,
  children,
}: {
  color: string | null;
  children: ReactNode;
}) {
  if (!color) return <>{children}</>;

  return (
    <div
      style={
        {
          "--primary": color,
          "--primary-foreground": contrastForeground(color),
          "--ring": color,
          "--sidebar-primary": color,
          "--chart-1": color,
          "--accent": `color-mix(in oklab, ${color} 18%, var(--background))`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export { Accent as SquadAccent };

function contrastForeground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // WCAG relative luminance
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.35 ? "oklch(0.16 0.015 260)" : "oklch(0.99 0 0)";
}
