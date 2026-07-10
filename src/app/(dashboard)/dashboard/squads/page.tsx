import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { SquadLogo } from "@features/squads/components/squad-shared";
import { listSquads } from "@features/squads/queries";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";
import { SquadFormDialog } from "./_components/squad-form";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  await requireDashboardRole("admin");
  const rows = await listSquads();

  const active = rows.filter(({ squad }) => !squad.archived);
  const archived = rows.filter(({ squad }) => squad.archived);
  const recruiting = active.filter(({ squad }) => squad.recruiting);
  const totalMembers = rows.reduce((sum, row) => sum + row.memberCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Squads" description="Rosters across the organization.">
        <SquadFormDialog />
      </PageHeader>

      <StatStrip>
        <StatItem label="Active" value={active.length} hint="Live rosters" />
        <StatItem
          label="Recruiting"
          value={recruiting.length}
          hint="Open for applications"
        />
        <StatItem
          label="Members"
          value={totalMembers}
          hint="Across all squads"
        />
        <StatItem
          label="Archived"
          value={archived.length}
          hint="Inactive squads"
        />
      </StatStrip>

      {rows.length === 0 ? (
        <p className="border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No squads yet — create the first roster.
        </p>
      ) : (
        <>
          <div className="grid gap-3 desktop:grid-cols-3">
            {active.map(({ squad, memberCount }) => (
              <Link
                key={squad.id}
                href={`/dashboard/squads/${squad.id}`}
                className="group relative flex items-center gap-4 overflow-hidden border bg-card p-4 shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
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
              </Link>
            ))}
          </div>

          {archived.length > 0 && (
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
  );
}
