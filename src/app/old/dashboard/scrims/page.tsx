import { desc, inArray } from "drizzle-orm";
import { EmptyState, PageHeader } from "@/components/dashboard/widgets";
import { requireRole, userRole } from "@/lib/session";
import { getLedSquadIds, getMemberSquadIds } from "@/server/authz";
import { db, scrims, squads } from "@/server/db";
import { ScrimCard } from "./scrim-card";
import { ScrimFormDialog } from "./scrim-form";

export const dynamic = "force-dynamic";

export default async function ScrimsPage() {
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
      ? await db.query.scrims.findMany({
          where: inArray(scrims.squadId, squadIds),
          orderBy: desc(scrims.date),
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
        title="Scrims"
        description="Practice match history, notes, and replays."
      >
        {manageableSquads.length > 0 && (
          <ScrimFormDialog squads={manageableSquads} />
        )}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState message="No scrims recorded yet." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((scrim) => (
            <ScrimCard
              key={scrim.id}
              scrim={scrim}
              squadName={scrim.squad.name}
              canManage={role === "admin" || ledIds.includes(scrim.squadId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function queryAll() {
  return db.query.scrims.findMany({
    orderBy: desc(scrims.date),
    with: { squad: true },
  });
}
