"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { formatDateTime } from "@/lib/format";
import { deleteAnnouncement } from "@/server/actions/announcements";
import type { Announcement } from "@/server/db/schema";
import { DashboardPanel } from "../../_components/page-surface";

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
    <DashboardPanel
      title={announcement.title}
      description={`${authorName} · ${formatDateTime(announcement.createdAt)}`}
      action={
        canDelete ? (
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            onClick={onDelete}
            aria-label="Delete announcement"
          >
            <Icons.Actions.Delete className="text-destructive" />
          </Button>
        ) : null
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={squadName ? "outline" : "default"}>
            {squadName ?? "Global"}
          </Badge>
          {isUnread && <Badge variant="destructive">New</Badge>}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {announcement.content}
        </p>
      </div>
    </DashboardPanel>
  );
}
