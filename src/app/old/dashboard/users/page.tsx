import { PageHeader } from "@/components/dashboard/widgets";
import { requireRole } from "@/lib/session";
import { db } from "@/server/db";
import { CreateUserDialog, UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requireRole("admin");

  const rows = await db.query.user.findMany({
    orderBy: (u, { asc }) => asc(u.name),
    with: { profile: true },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create accounts and control roles for the whole org."
      >
        <CreateUserDialog />
      </PageHeader>

      <UsersTable
        currentUserId={actor.id}
        users={rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role ?? "member",
          ign: u.profile?.ign ?? null,
          banned: u.banned ?? false,
        }))}
      />
    </div>
  );
}
