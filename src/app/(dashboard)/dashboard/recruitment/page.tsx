import { SegmentedBar } from "@components/charts/segmented-bar";
import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/shadcn/tabs";
import { listSquadManagers } from "@features/recruitment/queries";
import { APPLICATION_STATUS_LABELS } from "@lib/labels";
import { getManagedSquadIds } from "@server/authz";
import { applications, db, squads } from "@server/db";
import {
  type ApplicationStatus,
  applicationStatusEnum,
} from "@server/db/schema";
import { requireUser, userOrgRole } from "@server/session";
import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { forbidden } from "next/navigation";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { ApplicationCard } from "./_components/application-card";

const KANBAN_STATUS_META: Record<
  ApplicationStatus,
  { tone: string; barColor: string; description: string }
> = {
  applied: {
    tone: "border-primary/30 bg-primary/5",
    barColor: "var(--primary)",
    description: "New submissions waiting for first review.",
  },
  under_review: {
    tone: "border-blue-500/30 bg-blue-500/5",
    barColor: "var(--color-blue-500)",
    description: "Profiles being checked by recruitment.",
  },
  trial: {
    tone: "border-amber-500/30 bg-amber-500/5",
    barColor: "var(--color-amber-500)",
    description: "Players invited into trial or scrim review.",
  },
  accepted: {
    tone: "border-emerald-500/30 bg-emerald-500/5",
    barColor: "var(--color-emerald-500)",
    description: "Approved applicants ready for onboarding.",
  },
  rejected: {
    tone: "border-destructive/30 bg-destructive/5",
    barColor: "var(--destructive)",
    description: "Applications that are no longer moving forward.",
  },
};

export default async function RecruitmentPage() {
  const actor = await requireUser();
  const isAdmin = userOrgRole(actor) === "admin";
  let managedSquadIds: string[] = [];
  if (!isAdmin) {
    managedSquadIds = await getManagedSquadIds(actor.id);
    if (managedSquadIds.length === 0) forbidden();
  }

  const [rows, leaders, activeSquads] = await Promise.all([
    db.query.applications.findMany({
      where: isAdmin
        ? undefined
        : or(
            eq(applications.assignedLeaderId, actor.id),
            inArray(applications.squadId, managedSquadIds),
            isNull(applications.squadId),
          ),
      orderBy: desc(applications.createdAt),
      with: { assignedLeader: true, squad: true },
    }),
    isAdmin ? listSquadManagers() : Promise.resolve([]),
    isAdmin
      ? db
          .select({ id: squads.id, name: squads.name })
          .from(squads)
          .where(eq(squads.archived, false))
          .orderBy(squads.name)
      : Promise.resolve([]),
  ]);

  const board = applicationStatusEnum.enumValues.map((status) => ({
    status,
    applications: rows.filter((application) => application.status === status),
    ...KANBAN_STATUS_META[status],
  }));

  return (
    <PageSkeleton name="recruitment" loading={false}>
      <main>
        <PageHeader
          title="Recruitment"
          kicker="Squad"
          icon={Icons.Domain.Recruitment}
          description={
            isAdmin
              ? "Review applications, assign leaders, and make final calls."
              : "Applications assigned to you for review and trials."
          }
        />

        {rows.length === 0 ? (
          <EmptyState
            message="No applications yet."
            icon={Icons.Domain.Recruitment}
          />
        ) : (
          <div className="grid gap-6">
            <div className="border bg-card p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
                  <span
                    aria-hidden
                    className="h-3 w-0.75 -skew-x-12 bg-primary"
                  />
                  Pipeline
                </h2>
                <span className="text-xs text-muted-foreground">
                  {rows.length} application{rows.length === 1 ? "" : "s"} total
                </span>
              </div>
              <SegmentedBar
                title="Applications by status"
                segments={board.map((column) => ({
                  label: APPLICATION_STATUS_LABELS[column.status],
                  value: column.applications.length,
                  color: column.barColor,
                }))}
              />
            </div>

            {/* Mobile: one status at a time via tabs */}
            <Tabs
              defaultValue={
                board.find((column) => column.applications.length > 0)
                  ?.status ?? "applied"
              }
              className="desktop:hidden"
            >
              <TabsList className="w-full overflow-x-auto">
                {board.map((column) => (
                  <TabsTrigger
                    key={column.status}
                    value={column.status}
                    className="flex-1"
                  >
                    {APPLICATION_STATUS_LABELS[column.status]} (
                    {column.applications.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              {board.map((column) => (
                <TabsContent
                  key={column.status}
                  value={column.status}
                  className="mt-4"
                >
                  <p className="mb-3 text-xs leading-5 text-muted-foreground">
                    {column.description}
                  </p>
                  <div className="grid gap-3">
                    {column.applications.length === 0 ? (
                      <div className="rounded-none border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
                        No applications
                      </div>
                    ) : (
                      column.applications.map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          assignedLeaderName={
                            application.assignedLeader?.name ?? null
                          }
                          leaders={leaders}
                          squads={activeSquads}
                          isAdmin={isAdmin}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Desktop: full kanban board */}
            <div className="overflow-x-auto pb-3 mobile:hidden">
              <div className="grid min-w-368 grid-cols-5 gap-4">
                {board.map((column) => (
                  <section
                    key={column.status}
                    className="flex min-h-136 flex-col rounded-none border bg-card/60"
                  >
                    <div className={`border-b p-4 ${column.tone}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 font-heading text-lg font-bold uppercase tracking-wide">
                          <span
                            aria-hidden
                            className="h-4 w-1 -skew-x-12 bg-primary"
                          />
                          {APPLICATION_STATUS_LABELS[column.status]}
                        </h2>
                        <span className="grid size-7 -skew-x-6 place-items-center border border-border bg-background font-heading text-xs font-bold">
                          <span className="skew-x-6 tabular-nums">
                            {column.applications.length}
                          </span>
                        </span>
                      </div>
                      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
                        {column.description}
                      </p>
                    </div>

                    <div className="grid flex-1 content-start gap-3 p-3">
                      {column.applications.length === 0 ? (
                        <div className="rounded-none border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
                          No applications
                        </div>
                      ) : (
                        column.applications.map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            assignedLeaderName={
                              application.assignedLeader?.name ?? null
                            }
                            leaders={leaders}
                            squads={activeSquads}
                            isAdmin={isAdmin}
                          />
                        ))
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </PageSkeleton>
  );
}
