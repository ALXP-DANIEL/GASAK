import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { deleteTournament } from "@/features/tournaments/actions";
import { getTournament } from "@/features/tournaments/queries";
import { formatDateTime } from "@/lib/format";
import { canManageSquad } from "@/server/authz";
import { requireDashboardRole } from "../../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { user, role } = await requireDashboardRole(
    "admin",
    "leader",
    "member",
    "seller",
  );
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);
  if (!tournament) notFound();

  const canManage = await canManageSquad(user.id, role, tournament.squadId);
  const details: Array<[string, React.ReactNode]> = [
    ["Squad", tournament.squad?.name ?? "Unassigned"],
    ["Date", formatDateTime(tournament.date)],
    ["Organizer", tournament.organizer ?? "—"],
    ["Prize", tournament.prize ?? "—"],
    ["Opponent", tournament.opponent ?? "—"],
    [
      "Result",
      tournament.result ? (
        <Badge key="result" variant="secondary">
          {tournament.result}
        </Badge>
      ) : (
        "—"
      ),
    ],
    ["MVP", tournament.mvp ?? "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tournament.name}
        description="Tournament record"
        actions={
          canManage ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                  Edit
                </Link>
              </Button>
              <DeleteButton
                action={deleteTournament.bind(null, tournament.id)}
                title="Delete tournament?"
                description={`This will permanently remove "${tournament.name}".`}
                redirectTo="/dashboard/tournaments"
              />
            </>
          ) : undefined
        }
      />
      <Card>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
