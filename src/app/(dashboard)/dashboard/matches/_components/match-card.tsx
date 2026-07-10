import { EntityListCard } from "@components/shared/entity-list-card";
import { Badge } from "@components/ui/shadcn/badge";
import type { listMatches } from "@features/matches/queries";
import { formatDate } from "@lib/format";
import { resultBadgeVariant } from "@lib/labels";

export type MatchRow = Awaited<ReturnType<typeof listMatches>>[number];

export function MatchCard({ match }: { match: MatchRow }) {
  return (
    <EntityListCard
      href={`/dashboard/matches/${match.id}`}
      title={`vs ${match.opponent}`}
      meta={`${match.squad.name} · ${formatDate(match.date)}`}
      trailing={
        match.result ? (
          <Badge variant={resultBadgeVariant(match.result)}>
            {match.result}
          </Badge>
        ) : (
          <Badge variant="outline">No result</Badge>
        )
      }
    />
  );
}
