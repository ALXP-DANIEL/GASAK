"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
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
import { deleteScrim } from "@/server/actions/records";
import type { Scrim } from "@/server/db/schema";

export function ScrimCard({
  scrim,
  squadName,
  canManage,
}: {
  scrim: Scrim;
  squadName: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteScrim(scrim.id);
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
            <CardTitle className="text-base">vs {scrim.opponent}</CardTitle>
            <CardDescription>{formatDateTime(scrim.date)}</CardDescription>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              disabled={pending}
              onClick={onDelete}
            >
              <Icons.Actions.Delete size={16} className="text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{squadName}</Badge>
          {scrim.result && <Badge variant="outline">{scrim.result}</Badge>}
        </div>
        {scrim.notes && (
          <p className="text-sm text-muted-foreground">{scrim.notes}</p>
        )}
        {scrim.replayLink && (
          <a
            href={scrim.replayLink}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
          >
            Watch replay <Icons.Contact.ExternalLink size={14} />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
