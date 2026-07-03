"use client";

import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{announcement.title}</CardTitle>
              <Badge variant={squadName ? "secondary" : "default"}>
                {squadName ?? "Global"}
              </Badge>
              {isUnread && <Badge variant="destructive">New</Badge>}
            </div>
            <CardDescription>
              {authorName} · {formatDateTime(announcement.createdAt)}
            </CardDescription>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash size={16} className="text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
