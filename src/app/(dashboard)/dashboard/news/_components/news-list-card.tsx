import { NewsCard } from "@components/cards";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDateTime } from "@lib/format";
import type { News } from "@server/db/schema";

export function NewsListCard({
  news,
  squadName,
  authorName,
  isUnread,
}: {
  news: News;
  squadName: string | null;
  authorName: string;
  isUnread: boolean;
}) {
  return (
    <NewsCard
      item={news}
      variant="default"
      href={`/dashboard/news/${news.id}`}
      meta={
        <p className="text-xs text-muted-foreground">
          {authorName} · {formatDateTime(news.createdAt)}
        </p>
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Badge variant={squadName ? "outline" : "default"}>
            {squadName ?? "Global"}
          </Badge>
          {isUnread && <Badge variant="destructive">New</Badge>}
        </div>
      }
    />
  );
}
