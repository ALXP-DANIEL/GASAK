import {
  DetailRow,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { getMatch } from "@features/matches/queries";
import { formatDateTime } from "@lib/format";
import { deleteScrim } from "@server/actions/scrims";
import { canManageSquad } from "@server/authz";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../_components/dashboard-section";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { user, role } = await requireDashboardRole();
  const { matchId } = await params;
  const match = await getMatch(matchId);
  if (!match) notFound();

  const canManage = await canManageSquad(user.id, role, match.squadId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`vs ${match.opponent}`}
        breadcrumbLabel={`vs ${match.opponent}`}
        kicker="Matches"
        icon={Icons.Domain.Scrims}
        description="Match record"
        actions={
          canManage ? (
            <DeleteButton
              action={deleteScrim.bind(null, match.id)}
              title="Delete match?"
              description="This will permanently remove this match record."
              redirectTo="/dashboard/matches"
            />
          ) : undefined
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Match details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailRow label="Squad" value={match.squad.name} />
          <DetailRow label="Opponent" value={match.opponent} />
          <DetailRow label="Date" value={formatDateTime(match.date)} />
          <DetailRow
            label="Result"
            value={
              match.result ? (
                <Badge variant="secondary">{match.result}</Badge>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label="Replay"
            value={
              match.replayLink ? (
                <Link
                  href={match.replayLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline underline-offset-4 hover:text-primary"
                >
                  Watch replay
                </Link>
              ) : (
                "—"
              )
            }
          />
          {match.notes && (
            <DetailRow
              label="Notes"
              value={<span className="whitespace-pre-wrap">{match.notes}</span>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
