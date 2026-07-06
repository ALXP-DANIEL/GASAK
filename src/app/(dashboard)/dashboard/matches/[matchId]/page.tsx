import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import { Card, CardContent } from "@components/ui/shadcn/card";
import { getMatch } from "@features/matches/queries";
import { formatDateTime } from "@lib/format";
import { deleteScrim } from "@server/actions/scrims";
import { canManageSquad } from "@server/authz";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../_components/dashboard-section";

export const dynamic = "force-dynamic";

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
  const details: Array<[string, React.ReactNode]> = [
    ["Squad", match.squad.name],
    ["Opponent", match.opponent],
    ["Date", formatDateTime(match.date)],
    [
      "Result",
      match.result ? (
        <Badge key="result" variant="secondary">
          {match.result}
        </Badge>
      ) : (
        "—"
      ),
    ],
    [
      "Replay",
      match.replayLink ? (
        <Link
          key="replay"
          href={match.replayLink}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-4 hover:text-primary"
        >
          Watch replay
        </Link>
      ) : (
        "—"
      ),
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`vs ${match.opponent}`}
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
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-4 desktop:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {match.notes && (
            <div className="grid gap-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="text-sm whitespace-pre-wrap">{match.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
