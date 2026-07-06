import { Icons } from "@components/icons";
import { formatDate, stripHtml } from "@lib/format";
import type { News } from "@server/db/schema";
import Link from "next/link";

export function FeaturedNews({ item }: { item: News }) {
  const excerpt = stripHtml(item.content);

  return (
    <Link
      href={`/news/${item.id}`}
      className="group relative block w-full overflow-hidden rounded-lg border border-primary/25 bg-card transition-colors hover:border-primary/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 size-4 border-l-2 border-t-2 border-primary/50"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-10 size-4 border-b-2 border-r-2 border-primary/50"
      />

      <div className="flex flex-col gap-6 p-8 desktop:p-12">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            <Icons.Domain.News size={13} aria-hidden />
            Featured
          </span>
          <time
            dateTime={new Date(item.createdAt).toISOString()}
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {formatDate(item.createdAt)}
          </time>
        </div>

        <h1 className="text-balance font-heading text-3xl font-bold uppercase leading-tight tracking-wide transition-colors group-hover:text-primary desktop:text-5xl">
          {item.title}
        </h1>

        <p className="max-w-3xl text-balance leading-relaxed text-muted-foreground desktop:text-lg">
          {excerpt.slice(0, 220)}
          {excerpt.length > 220 ? "…" : ""}
        </p>

        <span className="inline-flex w-fit items-center gap-1.5 border-t border-primary/20 pt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Read full story
          <Icons.Layout.Navigation.CaretRight
            size={14}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
