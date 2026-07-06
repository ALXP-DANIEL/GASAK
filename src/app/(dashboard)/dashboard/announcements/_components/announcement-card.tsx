"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { NewsCard } from "@/components/news/news-card";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { formatDateTime } from "@/lib/format";
import { deleteAnnouncement } from "@/server/actions/announcements";
import type { Announcement } from "@/server/db/schema";

export function AnnouncementCard({
  announcement,
  squadName,
  authorName,
  canDelete,
  isUnread,
}: {
  announcement: Announcement;
  squadName: string | null;
  authorName: string;
  canDelete: boolean;
  isUnread: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteAnnouncement(announcement.id);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  return (
    <NewsCard
      item={announcement}
      variant="default"
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
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              disabled={pending}
              onClick={onDelete}
              aria-label="Delete announcement"
              className="ml-auto"
            >
              <Icons.Actions.Delete className="text-destructive" />
            </Button>
          )}
        </div>
      }
    />
  );
}
