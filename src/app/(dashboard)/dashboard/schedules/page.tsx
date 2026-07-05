import { inArray, isNull, or } from "drizzle-orm";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { listManagedTeamOptions } from "@/features/teams/queries";
import { getMemberSquadIds } from "@/server/authz";
import { db, events } from "@/server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import { ScheduleCalendar } from "./_components/schedule-calendar";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const { user, role } = await requireDashboardRole(
    "admin",
    "leader",
    "member",
    "seller",
  );
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const scopeFilter = squadIds
    ? squadIds.length
      ? or(isNull(events.squadId), inArray(events.squadId, squadIds))
      : isNull(events.squadId)
    : undefined;

  const [rows, squads] = await Promise.all([
    db.query.events.findMany({
      where: scopeFilter,
      orderBy: events.startsAt,
      with: { squad: true },
    }),
    listManagedTeamOptions(role, user.id),
  ]);
  const canManage = role === "admin" || squads.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedules"
        description="Upcoming and past events for your squads."
      />
      <ScheduleCalendar
        events={rows.map((event) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt?.toISOString() ?? null,
          location: event.location,
          squadId: event.squadId,
          squadName: event.squad?.name ?? null,
        }))}
        squads={squads}
        canManage={canManage}
        allowOrgWide={role === "admin"}
      />
    </div>
  );
}
