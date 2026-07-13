import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import {
  type RevenuePoint,
  RevenueTrendChart,
  SquadBarChart,
} from "@components/charts/lazy";
import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { formatRM } from "@lib/format";
import { ORDER_STATUS_LABELS } from "@lib/labels";
import { db, orders, scrims, squads, tournaments } from "@server/db";
import { format, startOfMonth, subDays } from "date-fns";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";
import { forbidden } from "next/navigation";
import { getDashboardContext } from "../_components/dashboard-context";
import {
  EmptyState,
  HomeListItem,
  HomePanel,
} from "../_components/home/widgets";

export default async function ReportsPage() {
  const { effectiveAccess } = await getDashboardContext();
  const showShop =
    effectiveAccess.orgRole === "admin" || effectiveAccess.orgRole === "seller";
  const showCompetition =
    effectiveAccess.orgRole === "admin" || effectiveAccess.managesSquad;
  if (!showShop && !showCompetition) forbidden();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const trendStart = subDays(now, 29);

  const [matchesPerSquad, tournamentsPerSquad, orderStats, revenueAgg] =
    await Promise.all([
      showCompetition
        ? db
            .select({ squad: squads, value: count(scrims.id) })
            .from(squads)
            .leftJoin(scrims, eq(scrims.squadId, squads.id))
            .where(eq(squads.archived, false))
            .groupBy(squads.id)
            .orderBy(desc(count(scrims.id)))
        : Promise.resolve([]),
      showCompetition
        ? db
            .select({ squad: squads, value: count(tournaments.id) })
            .from(squads)
            .leftJoin(tournaments, eq(tournaments.squadId, squads.id))
            .where(eq(squads.archived, false))
            .groupBy(squads.id)
            .orderBy(desc(count(tournaments.id)))
        : Promise.resolve([]),
      showShop
        ? db
            .select({ status: orders.status, value: count() })
            .from(orders)
            .groupBy(orders.status)
        : Promise.resolve([]),
      showShop
        ? db
            .select({ total: sum(orders.totalSen), orders: count() })
            .from(orders)
            .where(inArray(orders.status, ["paid", "processing", "completed"]))
        : Promise.resolve([]),
    ]);

  const [[monthlyRevenue], paidOrders] = showShop
    ? await Promise.all([
        db
          .select({ value: sum(orders.totalSen) })
          .from(orders)
          .where(
            and(
              inArray(orders.status, ["paid", "processing", "completed"]),
              gte(orders.createdAt, monthStart),
            ),
          ),
        db
          .select({ totalSen: orders.totalSen, updatedAt: orders.updatedAt })
          .from(orders)
          .where(
            and(
              inArray(orders.status, ["paid", "processing", "completed"]),
              gte(orders.updatedAt, trendStart),
            ),
          ),
      ])
    : [[{ value: null }], []];

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

  const totalMatches = matchesPerSquad.reduce((sum_, r) => sum_ + r.value, 0);
  const totalTournaments = tournamentsPerSquad.reduce(
    (sum_, r) => sum_ + r.value,
    0,
  );

  return (
    <PageSkeleton name="reports" loading={false}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Reports"
          kicker="System"
          icon={Icons.Domain.Reports}
          description="Activity summaries across the organization."
        />

        <StatStrip>
          {showShop && (
            <>
              <StatItem
                label="Total Revenue"
                value={formatRM(Number(revenueAgg[0]?.total ?? 0))}
                hint="Paid and completed orders"
                icon={Icons.Domain.Revenue}
              />
              <StatItem
                label="This Month"
                value={formatRM(Number(monthlyRevenue?.value ?? 0))}
                hint="Since the start of the month"
                icon={Icons.Domain.Orders}
              />
            </>
          )}
          {showCompetition && (
            <>
              <StatItem
                label="Matches"
                value={totalMatches}
                hint="Recorded across all squads"
                icon={Icons.Domain.Scrims}
              />
              <StatItem
                label="Tournaments"
                value={totalTournaments}
                hint="Entries across all squads"
                icon={Icons.Stats.Trophies}
              />
            </>
          )}
        </StatStrip>

        {showShop && (
          <HomePanel
            title="Revenue Trend"
            description="Daily paid revenue, last 30 days"
          >
            <RevenueTrendChart data={revenueTrend} />
          </HomePanel>
        )}

        <div className="grid gap-4 desktop:grid-cols-2">
          {showCompetition && (
            <>
              <HomePanel
                title="Matches per Squad"
                description="Total recorded scrims and matches"
              >
                {matchesPerSquad.length === 0 ? (
                  <EmptyState message="No data yet." />
                ) : (
                  <SquadBarChart
                    label="Matches"
                    data={matchesPerSquad.map(({ squad, value }) => ({
                      squad: squad.name,
                      value,
                    }))}
                  />
                )}
              </HomePanel>
              <HomePanel
                title="Tournaments per Squad"
                description="Total tournament entries"
              >
                {tournamentsPerSquad.length === 0 && (
                  <EmptyState message="No data yet." />
                )}
                {tournamentsPerSquad.map(({ squad, value }) => (
                  <HomeListItem
                    key={squad.id}
                    href={`/dashboard/squads/${squad.id}`}
                    title={squad.name}
                    trailing={<Badge variant="outline">{value}</Badge>}
                  />
                ))}
              </HomePanel>
            </>
          )}

          {showShop && (
            <HomePanel
              title="Orders by Status"
              description="Store order pipeline"
            >
              {orderStats.length === 0 && (
                <EmptyState message="No orders yet." />
              )}
              {orderStats.map((row) => (
                <HomeListItem
                  key={row.status}
                  title={ORDER_STATUS_LABELS[row.status]}
                  trailing={<Badge variant="outline">{row.value}</Badge>}
                />
              ))}
            </HomePanel>
          )}
        </div>
      </div>
    </PageSkeleton>
  );
}
