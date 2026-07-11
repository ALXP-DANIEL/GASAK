import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { listManagedSquadOptions } from "@features/squads/queries";
import { EVENT_TYPE_LABELS } from "@lib/labels";
import { getMemberSquadIds } from "@server/authz";
import { db, events } from "@server/db";
import { addDays } from "date-fns";
import { inArray, isNull, or } from "drizzle-orm";
import { requireDashboardRole } from "../_components/dashboard-section";
import { NextEventCountdown } from "./_components/next-event-countdown";
import { ScheduleCalendar } from "./_components/schedule-calendar";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const { user, role } = await requireDashboardRole();
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
    listManagedSquadOptions(role, user.id),
  ]);
  const canManage = role === "admin" || squads.length > 0;

  const now = new Date();
  const weekAhead = addDays(now, 7);
  const upcoming = rows.filter((event) => event.startsAt >= now);
  const thisWeek = upcoming.filter((event) => event.startsAt < weekAhead);
  const nextEvent = upcoming[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedules"
        kicker="Squad"
        icon={Icons.Domain.Calendar}
        description="Upcoming and past events for your squads."
      />

      {nextEvent && (
        <NextEventCountdown
          href={`/dashboard/schedules/${nextEvent.id}`}
          title={nextEvent.title}
          typeLabel={EVENT_TYPE_LABELS[nextEvent.type]}
          startsAtIso={nextEvent.startsAt.toISOString()}
          location={nextEvent.location}
          squadName={nextEvent.squad?.name ?? null}
        />
      )}

      <StatStrip>
        <StatItem
          label="This Week"
          value={thisWeek.length}
          hint="Next 7 days"
          icon={Icons.Domain.Lightning}
        />
        <StatItem
          label="Upcoming"
          value={upcoming.length}
          hint="On the calendar"
          icon={Icons.Domain.Calendar}
        />
        <StatItem
          label="All Events"
          value={rows.length}
          hint="Including past events"
          icon={Icons.Domain.Reports}
        />
      </StatStrip>

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
          squadAccentColor: event.squad?.accentColor ?? null,
        }))}
        squads={squads}
        canManage={canManage}
        allowOrgWide={role === "admin"}
      />
    </div>
  );
}
