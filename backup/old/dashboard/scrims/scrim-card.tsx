"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { DashboardPanel } from "@/components/old/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { Button } from "@/components/ui/shadcn/button";
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
    <DashboardPanel
      title={`vs ${scrim.opponent}`}
      description={formatDateTime(scrim.date)}
      action={
        canManage && (
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
          <BrandBadge>{squadName}</BrandBadge>
          {scrim.result && <BrandBadge>{scrim.result}</BrandBadge>}
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
      </div>
    </DashboardPanel>
  );
}
