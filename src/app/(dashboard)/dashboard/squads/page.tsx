import {
  EmptyState,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { Stagger } from "@components/motion/reveal";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import {
  SquadLogo,
  SquadRowCard,
} from "@features/squads/components/squad-shared";
import { listSquads } from "@features/squads/queries";
import {
  isSquadDivision,
  SQUAD_DIVISION_LABELS,
  SQUAD_DIVISION_SLUGS,
} from "@lib/labels";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";
import { SquadFormDialog } from "./_components/squad-form";

export default async function SquadsPage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>;
}) {
  await requireDashboardRole("admin");
  const { division } = await searchParams;
  const activeDivision = isSquadDivision(division) ? division : null;
  const rows = await listSquads(activeDivision ?? undefined);

  const active = rows.filter(({ squad }) => !squad.archived);
  const archived = rows.filter(({ squad }) => squad.archived);
  const recruiting = active.filter(({ squad }) => squad.recruiting);
  const totalMembers = rows.reduce((sum, row) => sum + row.memberCount, 0);

  return (
    <PageSkeleton name="squads" loading={false}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={
            activeDivision ? SQUAD_DIVISION_LABELS[activeDivision] : "Squads"
          }
          kicker="Management"
          icon={Icons.Domain.Squads}
          description={
            activeDivision
              ? `Rosters in the ${SQUAD_DIVISION_LABELS[activeDivision]} division.`
              : "Rosters across the organization."
          }
        >
          <SquadFormDialog
            key={activeDivision ?? "all"}
            lockedDivision={activeDivision ?? undefined}
          />
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
            {SQUAD_DIVISION_SLUGS.filter(
              (slug) => !activeDivision || slug === activeDivision,
            ).map((slug) => {
              const divisionRows = active.filter(
                ({ squad }) => squad.division === slug,
              );
              if (divisionRows.length === 0) return null;
              const label = SQUAD_DIVISION_LABELS[slug];
              return (
                <section key={slug} className="grid gap-3">
                  <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    <span
                      aria-hidden
                      className="h-3 w-0.75 -skew-x-12 bg-primary/60"
                    />
                    {label}
                  </h2>
                  <Stagger className="grid gap-3 desktop:grid-cols-3">
                    {divisionRows.map(({ squad, memberCount }) => (
                      <SquadRowCard
                        key={squad.id}
                        href={`/dashboard/squads/${squad.id}`}
                        squad={squad}
                        memberCount={memberCount}
                        badges={squad.recruiting && <Badge>Recruiting</Badge>}
                      />
                    ))}
                  </Stagger>
                </section>
              );
            })}

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
                          {memberCount} member
                          {memberCount === 1 ? "" : "s"}
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
