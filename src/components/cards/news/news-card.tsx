import {
  ContentCardFrame,
  type ContentCardVariant,
  contentCardSize,
} from "@components/cards/shared";
import { Icons } from "@components/icons";
import { formatDate, stripHtml } from "@lib/format";
import { cn } from "@lib/utils";
import type { News } from "@server/db/schema";
import Link from "next/link";
import type { ReactNode } from "react";

export type NewsCardProps = {
  item: News;
  variant?: ContentCardVariant;
  meta?: ReactNode;
  action?: ReactNode;
  href?: string;
};

export function NewsCard({
  item,
  variant = "compact",
  meta,
  action,
  href,
}: NewsCardProps) {
  const card = (
    <NewsCardContent
      item={item}
      variant={variant}
      meta={meta}
      action={action}
      linked={Boolean(href)}
    />
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}

function NewsCardContent({
  item,
  variant,
  meta,
  action,
  linked,
}: {
  item: News;
  variant: ContentCardVariant;
  meta?: ReactNode;
  action?: ReactNode;
  linked: boolean;
}) {
  const compact = variant === "compact";

  return (
    <ContentCardFrame
      className={cn(contentCardSize[variant], linked && "cursor-pointer")}
      interactive={linked}
    >
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Icons.Domain.News size={13} aria-hidden />
            News
          </span>
          <time
            dateTime={new Date(item.createdAt).toISOString()}
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {formatDate(item.createdAt)}
          </time>
        </div>

        <h2
          className={cn(
            "mt-4 text-balance font-heading font-semibold uppercase leading-tight tracking-wide transition-colors group-hover:text-primary",
            compact ? "line-clamp-3 text-xl" : "line-clamp-2 text-2xl",
          )}
        >
          {item.title}
        </h2>

        {meta && <div className="mt-3">{meta}</div>}

        <p
          className={cn(
            "mt-3 leading-relaxed text-muted-foreground",
            compact ? "line-clamp-3 text-sm" : "line-clamp-4 text-sm",
          )}
        >
          {stripHtml(item.content)}
        </p>

        <div className="mt-auto pt-6">
          {action ?? (
            <span className="inline-flex items-center gap-1.5 border-t border-border pt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors group-hover:text-primary">
              Read more
              <Icons.Layout.Navigation.CaretRight
                size={14}
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          )}
        </div>
      </div>
    </ContentCardFrame>
  );
}
