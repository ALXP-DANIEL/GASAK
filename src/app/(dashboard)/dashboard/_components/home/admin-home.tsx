import { startOfMonth } from "date-fns";
import { count, eq, gte, inArray, or, sum } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import {
  applications,
  db,
  events,
  orders,
  playerProfiles,
  squadMembers,
  squads,
  user as users,
} from "@/server/db";
import {
  EmptyState,
  HomeListItem,
  HomePanel,
  StatCard,
  StatGrid,
} from "./widgets";

export async function AdminHome() {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const [
    [activeTeams],
    [playerCount],
    [totalUsers],
    [usersThisMonth],
    [pendingApps],
    [revenue],
    teamOverview,
    upcoming,
    recentTournaments,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(squads)
      .where(eq(squads.archived, false)),
    db.select({ value: count() }).from(playerProfiles),
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, monthStart)),
    db
      .select({ value: count() })
      .from(applications)
      .where(
        or(
          eq(applications.status, "applied"),
          eq(applications.status, "under_review"),
          eq(applications.status, "trial"),
        ),
      ),
    db
      .select({ value: sum(orders.totalSen) })
      .from(orders)
      .where(inArray(orders.status, ["paid", "processing", "completed"])),
    db
      .select({ squad: squads, memberCount: count(squadMembers.id) })
      .from(squads)
      .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
      .where(eq(squads.archived, false))
      .groupBy(squads.id)
      .orderBy(squads.createdAt)
      .limit(5),
    db
      .select()
      .from(events)
      .where(gte(events.startsAt, now))
      .orderBy(events.startsAt)
      .limit(4),
    db.query.tournaments.findMany({
      orderBy: (t, { desc: descOp }) => descOp(t.date),
      limit: 4,
      with: { squad: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Organization overview for squads, players, recruitment, and
          operations.
        </p>
      </div>

      <StatGrid>
        <StatCard
          label="Active Squads"
          value={activeTeams.value}
          icon={Icons.Stats.Squads}
          hint={`${playerCount.value} registered players`}
        />
        <StatCard
          label="Total Users"
          value={totalUsers.value}
          icon={Icons.Stats.Players}
          hint={`+${usersThisMonth.value} this month`}
        />
        <StatCard
          label="Pending Applications"
          value={pendingApps.value}
          icon={Icons.Domain.Recruitment}
          hint="Awaiting review"
        />
        <StatCard
          label="Store Revenue"
          value={formatRM(Number(revenue.value ?? 0))}
          icon={Icons.Domain.Revenue}
          hint="Paid and completed orders"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <HomePanel
          title="Squads"
          description="Active rosters and member counts"
          action={{ href: "/dashboard/teams", label: "View all" }}
        >
          {teamOverview.length === 0 && (
            <EmptyState message="No active squads yet." />
          )}
          {teamOverview.map(({ squad, memberCount }) => (
            <HomeListItem
              key={squad.id}
              href={`/dashboard/teams/${squad.id}`}
              title={squad.name}
              meta={`Created ${formatDate(squad.createdAt)}`}
              trailing={<Badge variant="outline">{memberCount} members</Badge>}
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Upcoming Schedule"
          description="Next events across the organization"
          action={{ href: "/dashboard/schedules", label: "View all" }}
        >
          {upcoming.length === 0 && (
            <EmptyState message="No upcoming events." />
          )}
          {upcoming.map((event) => (
            <HomeListItem
              key={event.id}
              title={event.title}
              meta={formatDateTime(event.startsAt)}
              trailing={
                <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Recent Tournaments"
          description="Latest tournament activity"
          action={{ href: "/dashboard/tournaments", label: "View all" }}
        >
          {recentTournaments.length === 0 && (
            <EmptyState message="No tournaments yet." />
          )}
          {recentTournaments.map((tournament) => (
            <HomeListItem
              key={tournament.id}
              href={`/dashboard/tournaments/${tournament.id}`}
              title={tournament.name}
              meta={`${tournament.squad?.name ?? "Unassigned"} · ${formatDate(tournament.date)}`}
              trailing={
                tournament.result ? (
                  <Badge variant="secondary">{tournament.result}</Badge>
                ) : undefined
              }
            />
          ))}
        </HomePanel>
      </div>
    </div>
  );
}
