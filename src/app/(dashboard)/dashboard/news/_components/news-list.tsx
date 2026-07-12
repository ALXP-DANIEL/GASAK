"use client";

import { EmptyState } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Reveal, Stagger } from "@components/motion/reveal";
import { Badge } from "@components/ui/shadcn/badge";
import { Input } from "@components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import { formatDateTime, stripHtml } from "@lib/format";
import { cn } from "@lib/utils";
import type { News, Squad, User } from "@server/db/schema";
import Link from "next/link";
import { useMemo, useState } from "react";

export type NewsRow = News & {
  squad: Squad | null;
  author: User | null;
  isUnread: boolean;
};

const ALL_AUDIENCES = "all";

export function NewsList({
  rows,
  audienceOptions,
}: {
  rows: NewsRow[];
  audienceOptions: { value: string; label: string }[];
}) {
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState(ALL_AUDIENCES);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        const rowAudience = row.squad?.name ?? "Global";
        if (audience !== ALL_AUDIENCES && rowAudience !== audience) {
          return false;
        }
        if (query && !row.title.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isUnread !== b.isUnread) return a.isUnread ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [rows, search, audience]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search news"
          placeholder="Search news..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={audience}
          onValueChange={(value) => setAudience(value ?? ALL_AUDIENCES)}
        >
          <SelectTrigger aria-label="Audience" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_AUDIENCES}>All audiences</SelectItem>
            {audienceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No news match your filters." />
      ) : (
        <div className="flex flex-col gap-3">
          <Reveal>
            <FeaturedNewsItem item={filtered[0]} />
          </Reveal>
          {filtered.length > 1 && (
            <Stagger className="flex flex-col gap-2" from={0.1}>
              {filtered.slice(1).map((item) => (
                <NewsListItem key={item.id} item={item} />
              ))}
            </Stagger>
          )}
        </div>
      )}
    </div>
  );
}

function UnreadDot() {
  return (
    <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary">
      <span className="sr-only">Unread</span>
    </span>
  );
}

/** The newest post gets front-page treatment. */
function FeaturedNewsItem({ item }: { item: NewsRow }) {
  return (
    <Link
      href={`/dashboard/news/${item.id}`}
      className={cn(
        "corner-cut hover-lift group relative flex flex-col gap-2 overflow-hidden border bg-card p-5 shadow-xs desktop:p-6",
        item.isUnread && "border-primary/40",
      )}
    >
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-40"
      />
      <div className="relative flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-0.75 -skew-x-12 bg-primary" />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
          Latest
        </span>
        {item.isUnread && <UnreadDot />}
        <Badge
          variant={item.squad ? "outline" : "default"}
          className="ml-auto shrink-0"
        >
          {item.squad?.name ?? "Global"}
        </Badge>
      </div>
      <h3 className="relative font-heading text-2xl font-bold group-hover:text-primary">
        {item.title}
      </h3>
      <p className="relative line-clamp-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        {stripHtml(item.content)}
      </p>
      <p className="relative text-xs text-muted-foreground">
        {item.author?.name ?? "Unknown"} · {formatDateTime(item.createdAt)}
      </p>
    </Link>
  );
}

function NewsListItem({ item }: { item: NewsRow }) {
  return (
    <Link
      href={`/dashboard/news/${item.id}`}
      className="group relative flex items-start justify-between gap-3 overflow-hidden border bg-card py-3 pr-4 pl-5 shadow-xs transition-colors hover:bg-muted/30"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-transparent transition-colors",
          item.isUnread ? "bg-primary" : "group-hover:bg-primary/40",
        )}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {item.isUnread && <UnreadDot />}
          <h3
            className={cn(
              "truncate group-hover:text-primary",
              item.isUnread ? "font-semibold" : "font-medium",
            )}
          >
            {item.title}
          </h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {stripHtml(item.content)}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {item.author?.name ?? "Unknown"} · {formatDateTime(item.createdAt)}
        </p>
      </div>
      <Badge variant={item.squad ? "outline" : "default"} className="shrink-0">
        {item.squad?.name ?? "Global"}
      </Badge>
    </Link>
  );
}
