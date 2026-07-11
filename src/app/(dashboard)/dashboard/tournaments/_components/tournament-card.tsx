import { Badge } from "@components/ui/shadcn/badge";
import type { listTournaments } from "@features/tournaments/queries";
import { formatDate } from "@lib/format";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@lib/labels";
import type { TournamentStatus } from "@server/db/schema";
import Link from "next/link";

export type TournamentRow = Awaited<ReturnType<typeof listTournaments>>[number];

const statusVariant: Record<
  TournamentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  upcoming: "outline",
  ongoing: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function tournamentRecord(rounds: { outcome: string }[]) {
  const wins = rounds.filter((round) => round.outcome === "win").length;
  const losses = rounds.filter((round) => round.outcome === "loss").length;
  return { wins, losses, played: wins + losses };
}

export function TournamentCard({ tournament }: { tournament: TournamentRow }) {
  const record = tournamentRecord(tournament.rounds);

  return (
    <Link
      href={`/dashboard/tournaments/${tournament.id}`}
      className="hover-lift corner-cut group relative flex flex-col gap-3 overflow-hidden border bg-card p-4 pl-5 shadow-xs"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{
          backgroundColor: tournament.squad?.accentColor ?? "var(--primary)",
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading font-bold uppercase tracking-wide group-hover:text-primary">
            {tournament.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {tournament.squad?.name ?? "Unassigned"} ·{" "}
            {formatDate(tournament.date)}
          </p>
        </div>
        <Badge variant={statusVariant[tournament.status]} className="shrink-0">
          {TOURNAMENT_STATUS_LABELS[tournament.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{TOURNAMENT_FORMAT_LABELS[tournament.format]}</span>
        {record.played > 0 && (
          <span className="tabular-nums">
            {record.wins}W–{record.losses}L
          </span>
        )}
        {tournament.prize && <span>{tournament.prize}</span>}
        {tournament.placement && (
          <Badge variant="secondary">{tournament.placement}</Badge>
        )}
      </div>
    </Link>
  );
}
