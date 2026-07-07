import { db } from "@server/db";
import { requireOrgRole } from "@server/session";
import { PageHeader } from "../_components/page-surface";
import { UsersDataTable } from "./_components/users-data-table";
import { CreateUserDialog } from "./_components/users-table";

export const dynamic = "force-dynamic";

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

  return (
    <main>
      <PageHeader
        title="Users"
        description="Create accounts and control roles for the whole organization."
      >
        <CreateUserDialog />
      </PageHeader>

      <UsersDataTable users={users} currentUserId={actor.id} />
    </main>
  );
}
