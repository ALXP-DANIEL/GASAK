import { BrandCard } from "@components/ui/brand";
import { cn } from "@lib/utils";
import type { ComponentProps } from "react";

export type ContentCardVariant = "compact" | "default";

export const contentCardSize: Record<ContentCardVariant, string> = {
  compact: "min-h-72",
  default: "min-h-[21.5rem]",
};

export type ContentCardGridProps = ComponentProps<"div"> & {
  density?: "default" | "compact" | "wide";
};

export function ContentCardGrid({
  className,
  density = "default",
  ...props
}: ContentCardGridProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-4 desktop:justify-start",
        "*:w-full *:shrink-0",
        density === "default" && "*:desktop:w-[20rem] [&>*]:xl:w-[22rem]",
        density === "compact" &&
          "*:w-[calc(50%-0.5rem)] *:desktop:w-[13.5rem] [&>*]:xl:w-[14.5rem]",
        density === "wide" &&
          "*:desktop:w-[calc(50%-0.5rem)] [&>*]:xl:w-[34rem]",
        className,
      )}
      {...props}
    />
  );
}

export type ContentCardFrameProps = ComponentProps<typeof BrandCard>;

/**
 * Base card chrome shared by news/product/squad cards — a top accent line
 * that expands on hover and corner brackets, layered over BrandCard's gold
 * border language.
 */
export function ContentCardFrame({
  className,
  interactive,
  children,
  ...props
}: ContentCardFrameProps) {
  return (
    <BrandCard
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        className,
      )}
      interactive={interactive}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 z-30 h-0.5 origin-left bg-primary",
          interactive
            ? "scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
            : "scale-x-0",
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 size-3 border-l-2 border-t-2 border-primary/40"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-30 size-3 border-b-2 border-r-2 border-primary/40"
      />
      {children}
    </BrandCard>
  );
}
