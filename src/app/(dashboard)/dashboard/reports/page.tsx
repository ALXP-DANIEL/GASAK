import { startOfMonth } from "date-fns";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";
import { PageHeader } from "@/app/(dashboard)/dashboard/_components/page-surface";
import { TeamBarChart } from "@/components/charts/team-bar-chart";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { formatRM } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { db, orders, scrims, squads, tournaments } from "@/server/db";
import { requireDashboardRole } from "../_components/dashboard-section";
import {
  EmptyState,
  HomeListItem,
  HomePanel,
  StatCard,
  StatGrid,
} from "../_components/home/widgets";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { role } = await requireDashboardRole(
    "admin",
    "leader",
    "member",
    "seller",
  );
  const showShop = role === "admin" || role === "seller";
  const showCompetition = role !== "seller";
  const monthStart = startOfMonth(new Date());

  const [matchesPerTeam, tournamentsPerTeam, orderStats, revenueAgg] =
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
            .select({
              total: sum(orders.totalSen),
              monthly: sum(orders.totalSen),
            })
            .from(orders)
            .where(inArray(orders.status, ["paid", "processing", "completed"]))
        : Promise.resolve([]),
    ]);

  const [monthlyRevenue] = showShop
    ? await db
        .select({ value: sum(orders.totalSen) })
        .from(orders)
        .where(
          and(
            inArray(orders.status, ["paid", "processing", "completed"]),
            gte(orders.createdAt, monthStart),
          ),
        )
    : [{ value: null }];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Activity summaries across the organization."
      />

      {showShop && (
        <StatGrid className="xl:grid-cols-2">
          <StatCard
            label="Total Revenue"
            value={formatRM(Number(revenueAgg[0]?.total ?? 0))}
            icon={Icons.Domain.Revenue}
            hint="Paid, processing, and completed orders"
          />
          <StatCard
            label="Revenue This Month"
            value={formatRM(Number(monthlyRevenue?.value ?? 0))}
            icon={Icons.Domain.Orders}
            hint="Since the start of the month"
          />
        </StatGrid>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {showCompetition && (
          <>
            <HomePanel
              title="Matches per Squad"
              description="Total recorded scrims and matches"
            >
              {matchesPerTeam.length === 0 ? (
                <EmptyState message="No data yet." />
              ) : (
                <TeamBarChart
                  label="Matches"
                  data={matchesPerTeam.map(({ squad, value }) => ({
                    team: squad.name,
                    value,
                  }))}
                />
              )}
            </HomePanel>
            <HomePanel
              title="Tournaments per Squad"
              description="Total tournament entries"
            >
              {tournamentsPerTeam.length === 0 && (
                <EmptyState message="No data yet." />
              )}
              {tournamentsPerTeam.map(({ squad, value }) => (
                <HomeListItem
                  key={squad.id}
                  href={`/dashboard/teams/${squad.id}`}
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
            {orderStats.length === 0 && <EmptyState message="No orders yet." />}
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
  );
}
