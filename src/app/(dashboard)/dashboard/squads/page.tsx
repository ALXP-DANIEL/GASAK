import {
  EmptyState,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { Stagger } from "@components/motion/reveal";
import { CornerCutBorder } from "@components/shared/corner-cut-border";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { SquadLogo } from "@features/squads/components/squad-shared";
import { listSquads } from "@features/squads/queries";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";
import { SquadFormDialog } from "./_components/squad-form";

export default async function SquadsPage() {
  await requireDashboardRole("admin");
  const rows = await listSquads();

  const active = rows.filter(({ squad }) => !squad.archived);
  const archived = rows.filter(({ squad }) => squad.archived);
  const recruiting = active.filter(({ squad }) => squad.recruiting);
  const totalMembers = rows.reduce((sum, row) => sum + row.memberCount, 0);

  return (
    <PageSkeleton name="squads" loading={false}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Squads"
          kicker="Management"
          icon={Icons.Domain.Squads}
          description="Rosters across the organization."
        >
          <SquadFormDialog />
        </PageHeader>

        <StatStrip>
          <StatItem
            label="Active"
            value={active.length}
            hint="Live rosters"
            icon={Icons.Stats.Squads}
          />
          <StatItem
            label="Recruiting"
            value={recruiting.length}
            hint="Open for applications"
            icon={Icons.Domain.Recruitment}
          />
          <StatItem
            label="Members"
            value={totalMembers}
            hint="Across all squads"
            icon={Icons.Domain.Members}
          />
          <StatItem
            label="Archived"
            value={archived.length}
            hint="Inactive squads"
            icon={Icons.Domain.Squads}
          />
        </StatStrip>

        {rows.length === 0 ? (
          <EmptyState
            message="No squads yet — create the first roster."
            icon={Icons.Stats.Squads}
          />
        ) : (
          <>
            <Stagger className="grid gap-3 desktop:grid-cols-3">
              {active.map(({ squad, memberCount }) => (
                <Link
                  key={squad.id}
                  href={`/dashboard/squads/${squad.id}`}
                  className="hover-lift group block"
                >
                  <CornerCutBorder contentClassName="relative flex items-center gap-4 overflow-hidden bg-card p-4 shadow-xs">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1"
                      style={{
                        backgroundColor: squad.accentColor ?? "var(--primary)",
                      }}
                    />
                    <SquadLogo
                      src={squad.logoUrl}
                      name={squad.name}
                      className="size-14"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-lg font-bold uppercase tracking-wide group-hover:text-primary">
                        {squad.name}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {squad.recruiting && <Badge>Recruiting</Badge>}
                      </div>
                    </div>
                    <Icons.Layout.Navigation.CaretRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </CornerCutBorder>
                </Link>
              ))}
            </Stagger>

            {archived.length > 0 && (
              <section className="grid gap-3">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-muted-foreground">
                  <span
                    aria-hidden
                    className="h-3 w-0.75 -skew-x-12 bg-muted-foreground/50"
                  />
                  Archived
                </h2>
                <div className="grid gap-3 desktop:grid-cols-3">
                  {archived.map(({ squad, memberCount }) => (
                    <Link
                      key={squad.id}
                      href={`/dashboard/squads/${squad.id}`}
                      className="group flex items-center gap-4 border border-dashed bg-card/50 p-4 opacity-70 transition-opacity hover:opacity-100"
                    >
                      <SquadLogo
                        src={squad.logoUrl}
                        name={squad.name}
                        className="size-14 grayscale"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-heading text-lg font-bold uppercase tracking-wide">
                          {squad.name}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {memberCount} member{memberCount === 1 ? "" : "s"}
                        </p>
                        <div className="mt-1.5">
                          <Badge variant="outline">Archived</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageSkeleton>
  );
}
