import Link from "next/link";
import {
  ContentCardFrame,
  type ContentCardVariant,
  contentCardSize,
} from "@/components/cards/content-card-frame";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/server/db/schema";

export function NewsCard({
  item,
  variant = "compact",
  meta,
  action,
}: {
  item: Announcement;
  variant?: ContentCardVariant;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const compact = variant === "compact";

  return (
    <ContentCardFrame className={contentCardSize[variant]}>
      <div
        className={cn(
          "relative flex items-center justify-center border-b border-primary/20 bg-linear-to-br from-primary/25 via-primary/5 to-transparent",
          compact ? "aspect-[16/10]" : "h-32",
        )}
      >
        <Icons.Domain.News
          size={compact ? 40 : 34}
          className="text-primary/60"
          weight={compact ? undefined : "fill"}
        />
        <BrandBadge
          className={cn(
            "absolute left-3 top-3",
            compact && "border-primary bg-primary text-primary-foreground",
          )}
        >
          Announcement
        </BrandBadge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-primary",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {formatDate(item.createdAt)}
        </p>
        <h2
          className={cn(
            "mt-1 font-heading font-bold tracking-wide",
            compact ? "line-clamp-2 text-lg" : "text-xl",
          )}
        >
          {item.title}
        </h2>
        {meta && <div className="mt-2">{meta}</div>}
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            compact ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm",
          )}
        >
          {item.content}
        </p>
        {action && <div className="mt-auto pt-4">{action}</div>}
        {compact && (
          <Link
            href="/news"
            className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            Read more <Icons.Layout.Navigation.CaretRight size={12} />
          </Link>
        )}
      </div>
    </ContentCardFrame>
  );
}
