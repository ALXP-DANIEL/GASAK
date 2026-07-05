"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { DashboardPanel } from "@/components/old/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
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
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DashboardPanel
      title={announcement.title}
      description={`${authorName} · ${formatDateTime(announcement.createdAt)}`}
      action={
        canDelete && (
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            onClick={onDelete}
          >
            <Icons.Actions.Delete size={16} className="text-destructive" />
          </Button>
        )
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <BrandBadge
            className={!squadName ? "bg-primary text-primary-foreground" : ""}
          >
            {squadName ?? "Global"}
          </BrandBadge>
          {isUnread && (
            <BrandBadge className="border-destructive/50 bg-destructive/10 text-destructive">
              New
            </BrandBadge>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {announcement.content}
        </p>
      </div>
    </DashboardPanel>
  );
}
