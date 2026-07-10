"use client";

import { Button } from "@components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { Input } from "@components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import {
  type ChallongeParticipantOption,
  connectChallongeTournament,
  selectChallongeParticipant,
  syncChallongeTournament,
} from "@features/tournaments/actions";
import { formatDateTime } from "@lib/format";
import type { Tournament } from "@server/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function ChallongePanel({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [challongeRef, setChallongeRef] = useState("");
  const [participants, setParticipants] = useState<
    ChallongeParticipantOption[]
  >([]);
  const [participantId, setParticipantId] = useState("");

  const isConnected = Boolean(tournament.challongeTournamentId);
  const hasParticipant = Boolean(tournament.challongeParticipantId);
  // Re-show the connect input if the participant pick was interrupted
  // (e.g. page reload) — reconnecting re-fetches the participants list.
  const showConnect =
    !isConnected || (!hasParticipant && participants.length === 0);
  const showPicker = participants.length > 0;

  function handleConnect() {
    startTransition(async () => {
      const result = await connectChallongeTournament(
        tournament.id,
        challongeRef,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Challonge tournament linked — now pick your squad");
      setParticipants(result.participants);
      router.refresh();
    });
  }

  function handlePickParticipant() {
    if (!participantId) {
      toast.error("Pick which participant is your squad");
      return;
    }
    startTransition(async () => {
      const result = await selectChallongeParticipant(
        tournament.id,
        participantId,
      );
      if (!result.ok) {
        toast.error(result.error ?? "Could not save participant");
        return;
      }
      toast.success(result.message ?? "Participant saved");
      setParticipants([]);
      router.refresh();
    });
  }

  function handleSync() {
    startTransition(async () => {
      const result = await syncChallongeTournament(tournament.id);
      if (!result.ok) {
        toast.error(result.error ?? "Sync failed");
        return;
      }
      toast.success(result.message ?? "Synced");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challonge</CardTitle>
        <CardDescription>
          {isConnected
            ? "Pull round results straight from the Challonge bracket."
            : "Link the Challonge bracket to auto-fill rounds and results."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {showConnect || showPicker ? (
          <>
            {showConnect && (
              <div className="flex flex-col gap-2 desktop:flex-row">
                <Input
                  value={challongeRef}
                  onChange={(e) => setChallongeRef(e.target.value)}
                  placeholder="Challonge tournament ID or URL slug"
                  disabled={pending}
                />
                <Button
                  onClick={handleConnect}
                  disabled={pending || !challongeRef.trim()}
                >
                  {pending ? "Connecting..." : "Connect"}
                </Button>
              </div>
            )}
            {showPicker && (
              <div className="flex flex-col gap-2 desktop:flex-row">
                <Select
                  value={participantId}
                  onValueChange={setParticipantId}
                  disabled={pending}
                >
                  <SelectTrigger className="w-full desktop:w-72">
                    <SelectValue placeholder="Which participant is us?" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handlePickParticipant} disabled={pending}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSync} disabled={pending || !hasParticipant}>
              {pending ? "Syncing..." : "Sync now"}
            </Button>
            {!hasParticipant && (
              <span className="text-sm text-muted-foreground">
                Pick your squad's participant to enable sync.
              </span>
            )}
            {tournament.lastSyncedAt && (
              <span className="text-sm text-muted-foreground">
                Last synced {formatDateTime(tournament.lastSyncedAt)}
              </span>
            )}
            {tournament.challongeUrl && (
              <Link
                href={tournament.challongeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline underline-offset-4 hover:text-primary"
              >
                Open bracket
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
