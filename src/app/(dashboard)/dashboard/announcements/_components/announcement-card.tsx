import { NewsCard } from "@/components/news/news-card";
import { Badge } from "@/components/ui/shadcn/badge";
import { formatDateTime } from "@/lib/format";
import type { Announcement } from "@/server/db/schema";

export function AnnouncementCard({
  announcement,
  squadName,
  authorName,
  isUnread,
}: {
  announcement: Announcement;
  squadName: string | null;
  authorName: string;
  isUnread: boolean;
}) {
  return (
    <NewsCard
      item={announcement}
      variant="default"
      href={`/dashboard/announcements/${announcement.id}`}
      meta={
        <p className="text-xs text-muted-foreground">
          {authorName} · {formatDateTime(announcement.createdAt)}
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
