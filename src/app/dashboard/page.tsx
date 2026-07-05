import { subDays } from "date-fns";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  or,
  sum,
} from "drizzle-orm";
import Link from "next/link";
import {
  RevenueChart,
  type RevenuePoint,
} from "@/components/dashboard/revenue-chart";
import {
  DashboardListItem,
  DashboardPanel,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import {
  EVENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  SQUAD_ROLE_LABELS,
} from "@/lib/labels";
import { requireUser, userRole } from "@/lib/session";
import { getMemberSquadIds } from "@/server/authz";
import {
  announcements,
  applications,
  db,
  events,
  orders,
  playerProfiles,
  products,
  squads,
} from "@/server/db";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/shadcn/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const role = userRole(user);

  if (role === "admin") return <AdminDashboard />;
  if (role === "seller") return <SellerDashboard />;
  return <SquadDashboard userId={user.id} isLeader={role === "leader"} />;
}

function UpcomingEvents({
  items,
}: {
  items: {
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
        <Link href="/dashboard/calendar" className="hover:text-foreground">
          Open calendar →
        </Link>
      }
    >
      <div className="grid gap-3">
        {items.map((event) => (
          <DashboardListItem
            key={event.id}
            title={event.title}
            description={
              <>
                {formatDateTime(event.startsAt)}
                {event.location ? ` · ${event.location}` : ""}
              </>
            }
            badge={
              <BrandBadge>
                {
                  EVENT_TYPE_LABELS[
                    event.type as keyof typeof EVENT_TYPE_LABELS
                  ]
                }
              </BrandBadge>
            }
          />
        ))}
        {items.length === 0 && <EmptyState message="No upcoming events." />}
      </div>
    </DashboardPanel>
  );
}

async function AdminDashboard() {
  const now = new Date();
  const [[squadCount], [playerCount], [pendingApps], recentOrders, upcoming] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(squads)
        .where(eq(squads.archived, false)),
      db.select({ value: count() }).from(playerProfiles),
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
        .limit(5),
    ]);

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Everything happening across GASAK."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active squads"
          value={squadCount.value}
          Icon={Icons.Stats.Squads}
        />
        <StatCard
          label="Players"
          value={playerCount.value}
          Icon={Icons.Domain.Members}
        />
        <StatCard
          label="Pending recruitment"
          value={pendingApps.value}
          Icon={Icons.Domain.Recruitment}
        />
        <StatCard
          label="Recent orders"
          value={recentOrders.length}
          Icon={Icons.Domain.Orders}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
            <CardDescription>
              <Link href="/dashboard/orders" className="hover:text-foreground">
                Manage orders →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {order.orderNo} · {order.product.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.customerName} · {formatRM(order.totalSen)}
                  </p>
                </div>
                <Badge variant="outline">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <EmptyState message="No orders yet." />
            )}
          </CardContent>
        </Card>

        <UpcomingEvents items={upcoming} />
      </div>
    </div>
  );
}

async function SellerDashboard() {
  const since = subDays(new Date(), 13);
  const [paidAgg, [productCount], [pendingCount], recentOrders, paidOrders] =
    await Promise.all([
      db
        .select({ revenue: sum(orders.totalSen), orderCount: count() })
        .from(orders)
        .where(inArray(orders.status, ["paid", "processing", "completed"])),
      db
        .select({ value: count() })
        .from(products)
        .where(eq(products.active, true)),
      db
        .select({ value: count() })
        .from(orders)
        .where(inArray(orders.status, ["pending", "waiting_payment"])),
      db.query.orders.findMany({
        orderBy: desc(orders.createdAt),
        limit: 6,
        with: { product: true },
      }),
      db
        .select({ totalSen: orders.totalSen, updatedAt: orders.updatedAt })
        .from(orders)
        .where(
          and(
            inArray(orders.status, ["paid", "processing", "completed"]),
            gte(orders.updatedAt, since),
          ),
        ),
    ]);

  const days: RevenuePoint[] = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const key = formatDate(date);
    const revenueSen = paidOrders
      .filter((o) => formatDate(o.updatedAt) === key)
      .reduce((acc, o) => acc + o.totalSen, 0);
    return { day: key.slice(0, key.lastIndexOf(" ")), revenueSen };
  });

  return (
    <div>
      <PageHeader
        title="Seller overview"
        description="Shop performance at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue (paid)"
          value={formatRM(Number(paidAgg[0]?.revenue ?? 0))}
          Icon={Icons.Domain.Revenue}
        />
        <StatCard
          label="Paid orders"
          value={paidAgg[0]?.orderCount ?? 0}
          Icon={Icons.Domain.Orders}
        />
        <StatCard
          label="Awaiting action"
          value={pendingCount.value}
          Icon={Icons.Domain.Recruitment}
        />
        <StatCard
          label="Active products"
          value={productCount.value}
          Icon={Icons.Domain.Products}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue — last 14 days</CardTitle>
            <CardDescription>Based on verified payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={days} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
            <CardDescription>
              <Link href="/dashboard/orders" className="hover:text-foreground">
                Manage orders →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {order.orderNo} · {order.product.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.customerName} · {formatRM(order.totalSen)}
                  </p>
                </div>
                <Badge variant="outline">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <EmptyState message="No orders yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function SquadDashboard({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const squadIds = await getMemberSquadIds(userId);
  const now = new Date();

  const [mySquads, upcoming, news] = await Promise.all([
    squadIds.length
      ? db.query.squads.findMany({
          where: inArray(squads.id, squadIds),
          with: {
            members: { with: { user: { with: { profile: true } } } },
          },
        })
      : Promise.resolve([]),
    db
      .select()
      .from(events)
      .where(
        and(
          gte(events.startsAt, now),
          squadIds.length
            ? or(isNull(events.squadId), inArray(events.squadId, squadIds))
            : isNull(events.squadId),
        ),
      )
      .orderBy(events.startsAt)
      .limit(5),
    db.query.announcements.findMany({
      where: squadIds.length
        ? or(
            isNull(announcements.squadId),
            inArray(announcements.squadId, squadIds),
          )
        : isNull(announcements.squadId),
      orderBy: desc(announcements.createdAt),
      limit: 4,
      with: { squad: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={isLeader ? "Leader overview" : "Member overview"}
        description={
          isLeader
            ? "Your squad, schedule, and announcements."
            : "Your squad and what's coming up."
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {mySquads.length === 1 ? mySquads[0].name : "My squads"}
            </CardTitle>
            <CardDescription>
              <Link
                href="/dashboard/my-squad"
                className="hover:text-foreground"
              >
                View squad →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {mySquads.flatMap((squad) =>
              squad.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {member.user.profile?.ign ?? member.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mySquads.length > 1 ? `${squad.name} · ` : ""}
                      {member.user.name}
                    </p>
                  </div>
                  <Badge
                    variant={
                      member.squadRole === "leader" ? "default" : "secondary"
                    }
                  >
                    {SQUAD_ROLE_LABELS[member.squadRole]}
                  </Badge>
                </div>
              )),
            )}
            {mySquads.length === 0 && (
              <EmptyState message="You are not assigned to a squad yet. An admin will place you soon." />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <UpcomingEvents items={upcoming} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Announcements</CardTitle>
              <CardDescription>
                <Link
                  href="/dashboard/announcements"
                  className="hover:text-foreground"
                >
                  All announcements →
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {news.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{item.title}</p>
                    <Badge variant="outline">
                      {item.squad ? item.squad.name : "Global"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              ))}
              {news.length === 0 && (
                <EmptyState message="No announcements yet." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
