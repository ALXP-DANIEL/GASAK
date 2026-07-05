"use client";

import Image from "next/image";
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{tournament.name}</CardTitle>
            <CardDescription>
              {formatDateTime(tournament.date)}
              {tournament.organizer ? ` · ${tournament.organizer}` : ""}
            </CardDescription>
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
          {tournament.result && (
            <Badge variant="outline">{tournament.result}</Badge>
          )}
          {tournament.prize && (
            <Badge variant="outline">🏆 {tournament.prize}</Badge>
          )}
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
      </CardContent>
    </Card>
  );
}
