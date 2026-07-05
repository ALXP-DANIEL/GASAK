import { eq, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/old/dashboard/widgets";
import { requireRole, userRole } from "@/lib/session";
import { getLedSquadIds } from "@/server/authz";
import { db, squads } from "@/server/db";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const actor = await requireRole("admin", "leader", "member");
  const role = userRole(actor);

  let manageableSquads: { id: string; name: string }[] = [];
  if (role === "admin") {
    manageableSquads = await db
      .select({ id: squads.id, name: squads.name })
      .from(squads)
      .where(eq(squads.archived, false))
      .orderBy(squads.name);
  } else if (role === "leader") {
    const ledIds = await getLedSquadIds(actor.id);
    manageableSquads = ledIds.length
      ? await db
          .select({ id: squads.id, name: squads.name })
          .from(squads)
          .where(inArray(squads.id, ledIds))
          .orderBy(squads.name)
      : [];
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Practices, scrims, meetings, and tournaments."
      />
      <CalendarView
        canCreate={role === "admin" || manageableSquads.length > 0}
        allowOrgWide={role === "admin"}
        squads={manageableSquads}
      />
    </div>
  );
}
