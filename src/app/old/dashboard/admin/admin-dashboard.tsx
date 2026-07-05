import { startOfMonth } from "date-fns";
import { and, count, desc, eq, gte, inArray, or, sum } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import {
  DashboardListItem,
  DashboardPanel,
  EmptyState,
  StatCard,
} from "@/components/old/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/labels";
import {
  announcements,
  applications,
  db,
  events,
  orders,
  playerProfiles,
  products,
  squadMembers,
  squads,
  tournaments,
  user as users,
} from "@/server/db";

export async function AdminDashboard() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const [
    [activeSquads],
    [archivedSquads],
    [playerCount],
    [totalUsers],
    [usersThisMonth],
    [pendingApps],
    [totalOrders],
    [ordersThisMonth],
    [revenue],
    [activeProducts],
    [outOfStockProducts],
    [announcementCount],
    squadOverview,
    recruitmentRows,
    recentOrders,
    upcoming,
    recentTournaments,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(squads)
      .where(eq(squads.archived, false)),
    db.select({ value: count() }).from(squads).where(eq(squads.archived, true)),
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
    db.select({ value: count() }).from(orders),
    db
      .select({ value: count() })
      .from(orders)
      .where(gte(orders.createdAt, monthStart)),
    db
      .select({ value: sum(orders.totalSen) })
      .from(orders)
      .where(inArray(orders.status, ["paid", "processing", "completed"])),
    db
      .select({ value: count() })
      .from(products)
      .where(eq(products.active, true)),
    db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.active, true), eq(products.stock, 0))),
    db.select({ value: count() }).from(announcements),
    db
      .select({
        squad: squads,
        memberCount: count(squadMembers.id),
      })
      .from(squads)
      .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
      .where(eq(squads.archived, false))
      .groupBy(squads.id)
      .orderBy(squads.createdAt)
      .limit(5),
    db
      .select({ status: applications.status, value: count() })
      .from(applications)
      .groupBy(applications.status),
    db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 5,
      with: { product: true },
    }),
    db
      .select()
      .from(events)
      .where(gte(events.startsAt, now))
      .orderBy(events.startsAt)
      .limit(3),
    db.query.tournaments.findMany({
      orderBy: desc(tournaments.date),
      limit: 3,
      with: { squad: true },
    }),
  ]);

  const recruitmentCounts = Object.fromEntries(
    recruitmentRows.map((row) => [row.status, row.value]),
  ) as Partial<Record<keyof typeof APPLICATION_STATUS_LABELS, number>>;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card">
        <div
          className="absolute inset-0 bg-[url('/images/about-family.png')] bg-cover bg-center opacity-45"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/25" />
        <div className="relative flex min-h-36 items-center gap-5 p-6">
          <Image
            src="/images/gasak-logo.png"
            alt=""
            width={96}
            height={96}
            className="hidden size-24 rounded-full object-cover sm:block"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Admin Command Center
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide">
              Welcome back, Admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time operational view across GASAK ESPORT today.
            </p>
          </div>
        </div>
      </section>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total squads"
          value={activeSquads.value}
          Icon={Icons.Stats.Squads}
          hint={`${archivedSquads.value} archived`}
        />
        <StatCard
          label="Total players"
          value={playerCount.value}
          Icon={Icons.Domain.Members}
        />
        <StatCard
          label="Total users"
          value={totalUsers.value}
          Icon={Icons.Stats.Players}
          hint={`+${usersThisMonth.value} this month`}
        />
        <StatCard
          label="Pending recruitment"
          value={pendingApps.value}
          Icon={Icons.Domain.Recruitment}
        />
        <StatCard
          label="Total orders"
          value={totalOrders.value}
          Icon={Icons.Domain.Orders}
          hint={`+${ordersThisMonth.value} this month`}
        />
        <StatCard
          label="Total revenue"
          value={formatRM(Number(revenue.value ?? 0))}
          Icon={Icons.Domain.Revenue}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr_1.2fr]">
        <SquadOverviewPanel rows={squadOverview} total={activeSquads.value} />
        <RecruitmentFunnelPanel counts={recruitmentCounts} />
        <RecentOrdersPanel orders={recentOrders} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <AdminEventsPanel events={upcoming} />
        <TournamentOverviewPanel tournaments={recentTournaments} />
        <SystemSummaryPanel
          announcements={announcementCount.value}
          activeProducts={activeProducts.value}
          outOfStockProducts={outOfStockProducts.value}
          registeredUsers={totalUsers.value}
          usersThisMonth={usersThisMonth.value}
        />
      </div>
    </div>
  );
}

function SquadOverviewPanel({
  rows,
  total,
}: {
  rows: { squad: typeof squads.$inferSelect; memberCount: number }[];
  total: number;
}) {
  const colors = [
    "oklch(0.78 0.14 85)",
    "oklch(0.66 0.22 25)",
    "oklch(0.7 0.15 240)",
    "oklch(0.58 0.18 285)",
    "oklch(0.62 0.03 230)",
  ];
  const weighted = rows.map((row) => ({
    ...row,
    value: Math.max(row.memberCount, 1),
  }));
  const weightTotal = weighted.reduce(
    (sumValue, row) => sumValue + row.value,
    0,
  );
  let cursor = 0;
  const gradient =
    weighted.length > 0
      ? weighted
          .map((row, index) => {
            const start = cursor;
            const end = cursor + (row.value / weightTotal) * 100;
            cursor = end;
            return `${colors[index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ")
      : "oklch(0.78 0.14 85 / 25%) 0% 100%";

  return (
    <DashboardPanel
      title="Squad overview"
      description={
        <Link href="/old/dashboard/squads" className="hover:text-foreground">
          View all squads →
        </Link>
      }
    >
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="relative mx-auto flex size-40 items-center justify-center rounded-full">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="relative flex size-24 flex-col items-center justify-center rounded-full bg-card">
            <p className="font-heading text-3xl font-bold">{total}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          {weighted.map((row, index) => {
            const percent =
              weightTotal > 0 ? Math.round((row.value / weightTotal) * 100) : 0;
            return (
              <div
                key={row.squad.id}
                className="flex items-center justify-between gap-3 border-b border-primary/10 pb-2 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate">{row.squad.name}</span>
                  </p>
                  <p className="ml-4 text-xs text-muted-foreground">
                    {row.memberCount} member{row.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {percent}%
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <EmptyState message="No active squads yet." />}
        </div>
      </div>
    </DashboardPanel>
  );
}

function RecruitmentFunnelPanel({
  counts,
}: {
  counts: Partial<Record<keyof typeof APPLICATION_STATUS_LABELS, number>>;
}) {
  const stages: {
    status: keyof typeof APPLICATION_STATUS_LABELS;
    className: string;
    width: string;
  }[] = [
    {
      status: "applied",
      className: "bg-primary text-primary-foreground",
      width: "100%",
    },
    {
      status: "under_review",
      className: "bg-primary/80 text-primary-foreground",
      width: "84%",
    },
    { status: "trial", className: "bg-blue-600 text-white", width: "68%" },
    { status: "accepted", className: "bg-green-700 text-white", width: "52%" },
    {
      status: "rejected",
      className: "bg-destructive text-white",
      width: "38%",
    },
  ];

  return (
    <DashboardPanel
      title="Recruitment pipeline"
      description={
        <Link
          href="/old/dashboard/recruitment"
          className="hover:text-foreground"
        >
          View all applications →
        </Link>
      }
    >
      <div className="grid gap-2">
        {stages.map((stage) => (
          <div
            key={stage.status}
            className="grid grid-cols-[1fr_3rem] items-center gap-3"
          >
            <div
              className={`mx-auto flex h-10 items-center justify-center px-5 text-sm font-medium ${stage.className}`}
              style={{
                width: stage.width,
                clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
              }}
            >
              {APPLICATION_STATUS_LABELS[stage.status]}
            </div>
            <p className="text-right font-heading text-xl font-bold">
              {counts[stage.status] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function RecentOrdersPanel({
  orders: items,
}: {
  orders: (typeof orders.$inferSelect & {
    product: typeof products.$inferSelect;
  })[];
}) {
  return (
    <DashboardPanel
      title="Recent orders"
      description={
        <Link href="/old/dashboard/orders" className="hover:text-foreground">
          View all →
        </Link>
      }
    >
      <div className="grid gap-2">
        {items.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-primary/10 py-2 text-sm last:border-0"
          >
            <div className="relative flex size-10 items-center justify-center overflow-hidden rounded border border-primary/20 bg-primary/10">
              {order.product.imageUrl ? (
                <Image
                  src={order.product.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Icons.Domain.Orders size={20} className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-primary">
                {order.orderNo}
              </p>
              <p className="truncate font-medium">{order.product.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {order.customerPhone}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatRM(order.totalSen)}</p>
              <BrandBadge>{ORDER_STATUS_LABELS[order.status]}</BrandBadge>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No orders yet." />}
      </div>
    </DashboardPanel>
  );
}

function AdminEventsPanel({
  events: items,
}: {
  events: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    location: string | null;
  }[];
}) {
  return (
    <DashboardPanel
      title="Upcoming events"
      description={
        <Link href="/old/dashboard/calendar" className="hover:text-foreground">
          View calendar →
        </Link>
      }
    >
      <div className="grid gap-3">
        {items.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[3.25rem_1fr] gap-4 border-b border-primary/10 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex flex-col items-center justify-center rounded border border-primary/25 bg-card p-2 text-center">
              <span className="text-[10px] font-semibold uppercase text-primary">
                {event.startsAt.toLocaleString("en-US", { month: "short" })}
              </span>
              <span className="font-heading text-2xl font-bold">
                {event.startsAt.getDate()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(event.startsAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.location ??
                  EVENT_TYPE_LABELS[
                    event.type as keyof typeof EVENT_TYPE_LABELS
                  ]}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No upcoming events." />}
      </div>
    </DashboardPanel>
  );
}

function TournamentOverviewPanel({
  tournaments: items,
}: {
  tournaments: (typeof tournaments.$inferSelect & {
    squad: typeof squads.$inferSelect | null;
  })[];
}) {
  return (
    <DashboardPanel
      title="Tournament overview"
      description={
        <Link
          href="/old/dashboard/tournaments"
          className="hover:text-foreground"
        >
          View all →
        </Link>
      }
    >
      <div className="grid gap-3">
        {items.map((tournament) => (
          <DashboardListItem
            key={tournament.id}
            title={tournament.name}
            description={`${formatDate(tournament.date)}${
              tournament.squad ? ` · ${tournament.squad.name}` : ""
            }`}
            badge={
              <BrandBadge>
                {tournament.result ??
                  (tournament.date >= new Date() ? "Upcoming" : "Recorded")}
              </BrandBadge>
            }
          />
        ))}
        {items.length === 0 && <EmptyState message="No tournaments yet." />}
      </div>
    </DashboardPanel>
  );
}

function SystemSummaryPanel({
  announcements,
  activeProducts,
  outOfStockProducts,
  registeredUsers,
  usersThisMonth,
}: {
  announcements: number;
  activeProducts: number;
  outOfStockProducts: number;
  registeredUsers: number;
  usersThisMonth: number;
}) {
  const items = [
    {
      label: "Announcements",
      value: announcements,
      hint: "Published updates",
      Icon: Icons.Domain.Announcements,
    },
    {
      label: "Active products",
      value: activeProducts,
      hint: `${outOfStockProducts} out of stock`,
      Icon: Icons.Domain.Products,
    },
    {
      label: "Registered users",
      value: registeredUsers,
      hint: `+${usersThisMonth} this month`,
      Icon: Icons.Domain.Members,
    },
  ];

  return (
    <DashboardPanel title="System summary">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {items.map(({ label, value, hint, Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-lg border border-primary/15 bg-background/35 p-4"
          >
            <div className="rounded border border-primary/30 bg-primary/10 p-2.5 text-primary">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="font-heading text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
