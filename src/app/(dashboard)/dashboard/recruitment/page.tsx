import { desc, eq } from "drizzle-orm";
import { requireRole, userRole } from "@/lib/session";
import { applications, db, squads, user } from "@/server/db";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { ApplicationCard } from "./_components/application-card";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const actor = await requireRole("admin", "leader");
  const isAdmin = userRole(actor) === "admin";

  const [rows, leaders, activeSquads] = await Promise.all([
    db.query.applications.findMany({
      where: isAdmin ? undefined : eq(applications.assignedLeaderId, actor.id),
      orderBy: desc(applications.createdAt),
      with: { assignedLeader: true },
    }),
    isAdmin
      ? db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(eq(user.role, "leader"))
          .orderBy(user.name)
      : Promise.resolve([]),
    isAdmin
      ? db
          .select({ id: squads.id, name: squads.name })
          .from(squads)
          .where(eq(squads.archived, false))
          .orderBy(squads.name)
      : Promise.resolve([]),
  ]);

  const open = rows.filter(
    (application) =>
      application.status !== "accepted" && application.status !== "rejected",
  );
  const closed = rows.filter(
    (application) =>
      application.status === "accepted" || application.status === "rejected",
  );

  return (
    <main>
      <PageHeader
        title="Recruitment"
        description={
          isAdmin
            ? "Review applications, assign leaders, and make final calls."
            : "Applications assigned to you for review and trials."
        }
      />

      <div className="grid gap-8">
        <section className="grid gap-4">
          <h2 className="text-base font-medium">In progress ({open.length})</h2>
          {open.length === 0 ? (
            <EmptyState message="No open applications." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {open.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  assignedLeaderName={application.assignedLeader?.name ?? null}
                  leaders={leaders}
                  squads={activeSquads}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </section>

        {closed.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-base font-medium">Decided ({closed.length})</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {closed.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  assignedLeaderName={application.assignedLeader?.name ?? null}
                  leaders={leaders}
                  squads={activeSquads}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
