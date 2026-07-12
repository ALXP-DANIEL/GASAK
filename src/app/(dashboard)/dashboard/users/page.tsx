import { SegmentedBar } from "@components/charts/segmented-bar";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { db } from "@server/db";
import { requireOrgRole } from "@server/session";
import { PageHeader } from "../_components/page-surface";
import { UsersDataTable } from "./_components/users-data-table";
import { CreateUserDialog } from "./_components/users-table";

export default async function UsersPage() {
  const actor = await requireOrgRole("admin");

  const rows = await db.query.user.findMany({
    orderBy: (table, { asc }) => asc(table.name),
    with: { profile: true },
  });

  const users = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role ?? "user",
    ign: row.profile?.ign ?? null,
    banned: row.banned ?? false,
  }));

  const admins = users.filter((user) => user.role === "admin").length;
  const sellers = users.filter((user) => user.role === "seller").length;
  const banned = users.filter((user) => user.banned).length;

  return (
    <main>
      <PageHeader
        title="Users"
        kicker="System"
        icon={Icons.Domain.Accounts}
        description="Create accounts and control roles for the whole organization."
      >
        <CreateUserDialog />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <StatStrip>
          <StatItem
            label="Accounts"
            value={users.length}
            hint="All registered users"
            icon={Icons.Domain.Members}
          />
          <StatItem
            label="Admins"
            value={admins}
            hint="Full organization access"
            icon={Icons.Actions.Settings}
          />
          <StatItem
            label="Sellers"
            value={sellers}
            hint="Commerce access"
            icon={Icons.Domain.Shop}
          />
          <StatItem
            label="Banned"
            value={banned}
            hint="Suspended accounts"
            icon={Icons.Status.Failed}
          />
        </StatStrip>

        <div className="border bg-card p-4 shadow-xs">
          <SegmentedBar
            title="Accounts by role"
            segments={[
              {
                label: "Admins",
                value: admins,
                color: "var(--chart-1)",
              },
              {
                label: "Sellers",
                value: sellers,
                color: "var(--chart-2)",
              },
              {
                label: "Members",
                value: users.length - admins - sellers,
                color: "var(--chart-5)",
              },
            ]}
          />
        </div>

        <UsersDataTable users={users} currentUserId={actor.id} />
      </div>
    </main>
  );
}
