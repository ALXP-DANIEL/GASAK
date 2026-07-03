import { desc, inArray } from "drizzle-orm";
import { EmptyState, PageHeader } from "@/components/dashboard/widgets";
import { requireRole, userRole } from "@/lib/session";
import { getLedSquadIds, getMemberSquadIds } from "@/server/authz";
import { db, squads, tournaments } from "@/server/db";
import { TournamentCard } from "./tournament-card";
import { TournamentFormDialog } from "./tournament-form";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const actor = await requireRole("admin", "leader", "member");
  const role = userRole(actor);

  let rows: Awaited<ReturnType<typeof queryAll>>;
  let manageableSquads: { id: string; name: string }[] = [];

  if (role === "admin") {
    rows = await queryAll();
    manageableSquads = await db
      .select({ id: squads.id, name: squads.name })
      .from(squads)
      .orderBy(squads.name);
  } else {
    const squadIds = await getMemberSquadIds(actor.id);
    rows = squadIds.length
      ? await db.query.tournaments.findMany({
          where: inArray(tournaments.squadId, squadIds),
          orderBy: desc(tournaments.date),
          with: { squad: true },
        })
      : [];
    if (role === "leader") {
      const ledIds = await getLedSquadIds(actor.id);
      manageableSquads = ledIds.length
        ? await db
            .select({ id: squads.id, name: squads.name })
            .from(squads)
            .where(inArray(squads.id, ledIds))
            .orderBy(squads.name)
        : [];
    }
  }

  const ledIds = role === "leader" ? manageableSquads.map((s) => s.id) : [];

  return (
    <div>
      <PageHeader
        title="Tournaments"
        description="Official tournament records and results."
      >
        {manageableSquads.length > 0 && (
          <TournamentFormDialog squads={manageableSquads} />
        )}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState message="No tournaments recorded yet." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              squadName={tournament.squad?.name ?? "—"}
              canManage={
                role === "admin" ||
                (tournament.squadId !== null &&
                  ledIds.includes(tournament.squadId))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function queryAll() {
  return db.query.tournaments.findMany({
    orderBy: desc(tournaments.date),
    with: { squad: true },
  });
}
