import { BrandCard } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

export type ContentCardVariant = "compact" | "default";

export const contentCardSize: Record<ContentCardVariant, string> = {
  compact: "min-h-72",
  default: "min-h-[21.5rem]",
};

export function ContentCardGrid({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"div"> & {
  density?: "default" | "compact" | "wide";
}) {
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

export function ContentCardFrame({
  className,
  interactive,
  ...props
}: React.ComponentProps<typeof BrandCard>) {
  return (
    <BrandCard
      className={cn("flex h-full flex-col overflow-hidden", className)}
      interactive={interactive}
      {...props}
    />
  );
}
