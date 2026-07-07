import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { DataTable } from "@components/shared/data-table";
import { getTournament } from "@features/tournaments/queries";
import { db, scrims } from "@server/db";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireDashboardRole } from "../../../_components/dashboard-section";
import { columns } from "./_components/columns";

export const dynamic = "force-dynamic";

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  await requireDashboardRole();
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);
  if (!tournament) notFound();

  const rows = tournament.squadId
    ? await db.query.scrims.findMany({
        where: eq(scrims.squadId, tournament.squadId),
        orderBy: desc(scrims.date),
        with: { squad: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${tournament.name} — Matches`}
        description={`Match history for ${tournament.squad?.name ?? "this tournament's squad"}.`}
      />
      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No matches recorded for this squad."
        searchColumnId="opponent"
        searchPlaceholder="Search opponent..."
      />
    </div>
  );
}
