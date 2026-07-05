"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { DashboardPanel } from "@/components/old/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { Button } from "@/components/ui/shadcn/button";
import { formatDateTime } from "@/lib/format";
import { deleteTournament } from "@/server/actions/records";
import type { Tournament } from "@/server/db/schema";

export function TournamentCard({
  tournament,
  squadName,
  canManage,
}: {
  tournament: Tournament;
  squadName: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteTournament(tournament.id);
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
      title={tournament.name}
      description={`${formatDateTime(tournament.date)}${
        tournament.organizer ? ` · ${tournament.organizer}` : ""
      }`}
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
          {tournament.result && <BrandBadge>{tournament.result}</BrandBadge>}
          {tournament.prize && <BrandBadge>{tournament.prize}</BrandBadge>}
        </div>
        <div className="grid gap-1 text-sm text-muted-foreground">
          {tournament.opponent && <p>Opponent: {tournament.opponent}</p>}
          {tournament.mvp && <p>MVP: {tournament.mvp}</p>}
        </div>
        {tournament.screenshotUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-lg border">
            <Image
              src={tournament.screenshotUrl}
              alt={`${tournament.name} result`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
