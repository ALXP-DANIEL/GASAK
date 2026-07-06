import { requireOrgRole } from "@/lib/session";
import { db } from "@/server/db";
import { PageHeader } from "../_components/page-surface";
import { CreateUserDialog, UsersTable } from "./_components/users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requireOrgRole("admin");

  const rows = await db.query.user.findMany({
    orderBy: (table, { asc }) => asc(table.name),
    with: { profile: true },
  });

  return (
    <main>
      <PageHeader
        title="Users"
        description="Create accounts and control roles for the whole organization."
      >
        <CreateUserDialog />
      </PageHeader>

      <UsersTable
        currentUserId={actor.id}
        users={rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role ?? "user",
          ign: row.profile?.ign ?? null,
          banned: row.banned ?? false,
        }))}
      />
    </main>
  );
}
