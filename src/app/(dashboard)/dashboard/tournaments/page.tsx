import {
  EmptyState,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { Stagger } from "@components/motion/reveal";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/shadcn/tabs";
import { listManagedSquadOptions } from "@features/squads/queries";
import { listTournaments } from "@features/tournaments/queries";
import { formatDate } from "@lib/format";
import { getMemberSquadIds } from "@server/authz";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";
import { TournamentCard } from "./_components/tournament-card";
import { TournamentFormDialog } from "./_components/tournament-form-dialog";
import { TournamentsAllTable } from "./_components/tournaments-all-table";

export default async function TournamentsPage() {
  const { user, role } = await requireDashboardRole();
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const [rows, squads] = await Promise.all([
    listTournaments(squadIds),
    listManagedSquadOptions(role, user.id),
  ]);
  const canManage = squads.length > 0;
  const squadFilterOptions = Array.from(
    new Set(rows.map((row) => row.squad?.name ?? "Unassigned")),
  ).map((value) => ({ value, label: value }));

  const ongoing = rows.filter((row) => row.status === "ongoing");
  const upcoming = rows.filter((row) => row.status === "upcoming");
  const completed = rows.filter((row) => row.status === "completed");
  const championshipRuns = completed.filter(
    (row) => row.placement && /champion/i.test(row.placement),
  );
  const championships = championshipRuns.length;

  const groups = [
    {
      value: "ongoing",
      label: `Ongoing (${ongoing.length})`,
      rows: ongoing,
      empty: "No tournaments in progress.",
    },
    {
      value: "upcoming",
      label: `Upcoming (${upcoming.length})`,
      rows: upcoming,
      empty: "Nothing scheduled — create a tournament when you register.",
    },
    {
      value: "completed",
      label: `Completed (${completed.length})`,
      rows: completed,
      empty: "No finished tournaments yet.",
    },
  ];
  const defaultTab = ongoing.length
    ? "ongoing"
    : upcoming.length
      ? "upcoming"
      : "completed";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tournaments"
        kicker="Squad"
        icon={Icons.Stats.Trophies}
        description="Every bracket run across your squads — live, planned, and archived."
        actions={
          canManage ? <TournamentFormDialog squads={squads} /> : undefined
        }
      />

      <StatStrip>
        <StatItem
          label="Ongoing"
          value={ongoing.length}
          hint="In progress"
          icon={Icons.Domain.Lightning}
        />
        <StatItem
          label="Upcoming"
          value={upcoming.length}
          hint="On the calendar"
          icon={Icons.Domain.Calendar}
        />
        <StatItem
          label="Completed"
          value={completed.length}
          hint="Runs archived"
          icon={Icons.Status.Success}
        />
        <StatItem
          label="Championships"
          value={championships}
          hint="First-place finishes"
          icon={Icons.Stats.Trophies}
        />
      </StatStrip>

      {championshipRuns.length > 0 && (
        <div className="corner-cut relative overflow-hidden border border-primary/40 bg-primary/5 p-4">
          <div
            aria-hidden
            className="bg-grid pointer-events-none absolute inset-0 opacity-40"
          />
          <div className="relative grid gap-3">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-primary">
              <span aria-hidden className="h-3 w-0.75 -skew-x-12 bg-primary" />
              Trophy Case
            </h2>
            <Stagger className="flex flex-wrap gap-3">
              {championshipRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/tournaments/${run.id}`}
                  className="hover-lift flex items-center gap-3 border border-primary/30 bg-card px-3 py-2"
                >
                  <Icons.Stats.Trophies
                    aria-hidden
                    className="size-5 shrink-0 text-primary"
                    weight="fill"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-bold uppercase tracking-wide">
                      {run.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {run.squad?.name ?? "Unassigned"} · {formatDate(run.date)}{" "}
                      · {run.placement}
                    </p>
                  </div>
                </Link>
              ))}
            </Stagger>
          </div>
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList className="mobile:w-full">
          {groups.map((group) => (
            <TabsTrigger
              key={group.value}
              value={group.value}
              className="mobile:flex-1"
            >
              {group.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.value} value={group.value} className="mt-4">
            {group.rows.length === 0 ? (
              <EmptyState message={group.empty} icon={Icons.Stats.Trophies} />
            ) : (
              <Stagger className="grid gap-3 desktop:grid-cols-2">
                {group.rows.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </Stagger>
            )}
          </TabsContent>
        ))}

        <TabsContent value="all" className="mt-4">
          <TournamentsAllTable
            rows={rows}
            squadFilterOptions={squadFilterOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
