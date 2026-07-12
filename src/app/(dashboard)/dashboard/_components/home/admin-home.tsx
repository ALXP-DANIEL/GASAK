import { type RevenuePoint, RevenueTrendChart } from "@components/charts/lazy";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDate, formatDateTime, formatRM } from "@lib/format";
import { APPLICATION_STATUS_LABELS, EVENT_TYPE_LABELS } from "@lib/labels";
import {
  applications,
  db,
  events,
  orders,
  playerProfiles,
  scrims,
  squadMembers,
  squads,
  tournamentRounds,
  user as users,
} from "@server/db";
import { format, startOfMonth, subDays } from "date-fns";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  notExists,
  or,
  sum,
} from "drizzle-orm";
import { PageHeader } from "../page-surface";
import { EmptyState, HomeListItem, HomePanel } from "./widgets";

export async function AdminHome() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const trendStart = subDays(now, 29);

  const [
    [activeTeams],
    [playerCount],
    [totalUsers],
    [usersThisMonth],
    [revenue],
    [unpaidOrders],
    pendingApplications,
    teamOverview,
    upcoming,
    recentTournaments,
    needsResult,
    paidOrders,
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
      .select({ value: sum(orders.totalSen) })
      .from(orders)
      .where(inArray(orders.status, ["paid", "processing", "completed"])),
    db
      .select({ value: count() })
      .from(orders)
      .where(inArray(orders.status, ["pending", "waiting_payment"])),
    db.query.applications.findMany({
      where: or(
        eq(applications.status, "applied"),
        eq(applications.status, "under_review"),
        eq(applications.status, "trial"),
      ),
      orderBy: desc(applications.createdAt),
      limit: 3,
    }),
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
      .limit(5),
    db.query.tournaments.findMany({
      orderBy: (t, { desc: descOp }) => descOp(t.date),
      limit: 4,
      with: { squad: true },
    }),
    db
      .select()
      .from(events)
      .where(
        and(
          lt(events.startsAt, now),
          inArray(events.type, ["scrim", "tournament"]),
          notExists(
            db.select().from(scrims).where(eq(scrims.eventId, events.id)),
          ),
          notExists(
            db
              .select()
              .from(tournamentRounds)
              .where(eq(tournamentRounds.eventId, events.id)),
          ),
        ),
      )
      .orderBy(desc(events.startsAt))
      .limit(3),
    db
      .select({ totalSen: orders.totalSen, updatedAt: orders.updatedAt })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ["paid", "processing", "completed"]),
          gte(orders.updatedAt, trendStart),
        ),
      ),
  ]);

  const attentionCount =
    pendingApplications.length + needsResult.length + unpaidOrders.value;

  const revenueTrend: RevenuePoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = subDays(now, 29 - i);
    return { key: format(day, "yyyy-MM-dd"), label: format(day, "d MMM") };
  }).map(({ key, label }) => ({
    label,
    revenue:
      paidOrders
        .filter((order) => format(order.updatedAt, "yyyy-MM-dd") === key)
        .reduce((total, order) => total + order.totalSen, 0) / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin Dashboard"
        kicker={`Overview — ${format(now, "EEEE, d MMMM")}`}
        icon={Icons.Layout.Navigation.Home}
        description="Organization overview for squads, players, recruitment, and operations."
      />

      <StatStrip>
        <StatItem
          label="Active Squads"
          value={activeTeams.value}
          hint={`${playerCount.value} registered players`}
          icon={Icons.Stats.Squads}
        />
        <StatItem
          label="Total Users"
          value={totalUsers.value}
          hint={`+${usersThisMonth.value} this month`}
          icon={Icons.Domain.Members}
        />
        <StatItem
          label="Needs Attention"
          value={attentionCount}
          hint="Applications, results, payments"
          icon={Icons.Domain.Lightning}
        />
        <StatItem
          label="Store Revenue"
          value={formatRM(Number(revenue.value ?? 0))}
          hint="Paid and completed orders"
          icon={Icons.Domain.Revenue}
        />
      </StatStrip>

      <HomePanel
        title="Needs Attention"
        description="Work waiting on someone — clear this list daily"
      >
        {attentionCount === 0 && (
          <EmptyState message="All clear — nothing is waiting on you." />
        )}
        {pendingApplications.map((application) => (
          <HomeListItem
            key={application.id}
            href="/dashboard/recruitment"
            title={`${application.fullName} applied as ${application.ign}`}
            meta={`Recruitment · ${formatDate(application.createdAt)}`}
            trailing={
              <Badge variant="outline">
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
            }
          />
        ))}
        {needsResult.map((event) => (
          <HomeListItem
            key={event.id}
            href={`/dashboard/schedules/${event.id}`}
            title={`Log the result for "${event.title}"`}
            meta={`Schedule · ${formatDateTime(event.startsAt)}`}
            trailing={
              <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
            }
          />
        ))}
        {unpaidOrders.value > 0 && (
          <HomeListItem
            href="/dashboard/orders"
            title={`${unpaidOrders.value} order${unpaidOrders.value === 1 ? "" : "s"} awaiting payment`}
            meta="Commerce · pending or waiting payment"
            trailing={<Badge variant="outline">Orders</Badge>}
          />
        )}
      </HomePanel>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
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
              href={`/dashboard/schedules/${event.id}`}
              title={event.title}
              meta={formatDateTime(event.startsAt)}
              trailing={
                <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Squads"
          description="Active rosters and member counts"
          action={{ href: "/dashboard/squads", label: "View all" }}
        >
          {teamOverview.length === 0 && (
            <EmptyState message="No active squads yet." />
          )}
          {teamOverview.map(({ squad, memberCount }) => (
            <HomeListItem
              key={squad.id}
              href={`/dashboard/squads/${squad.id}`}
              title={squad.name}
              meta={`Created ${formatDate(squad.createdAt)}`}
              trailing={<Badge variant="outline">{memberCount} members</Badge>}
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
                tournament.placement ? (
                  <Badge variant="secondary">{tournament.placement}</Badge>
                ) : undefined
              }
            />
          ))}
        </HomePanel>
      </div>

      <HomePanel
        title="Revenue — Last 30 Days"
        description="Daily revenue from paid orders"
        action={{ href: "/dashboard/reports", label: "Reports" }}
      >
        <RevenueTrendChart data={revenueTrend} />
      </HomePanel>
    </div>
  );
}
