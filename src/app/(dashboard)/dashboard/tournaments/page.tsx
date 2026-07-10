import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/shadcn/tabs";
import { listManagedSquadOptions } from "@features/squads/queries";
import { listTournaments } from "@features/tournaments/queries";
import { getMemberSquadIds } from "@server/authz";
import { requireDashboardRole } from "../_components/dashboard-section";
import { TournamentCard } from "./_components/tournament-card";
import { TournamentFormDialog } from "./_components/tournament-form-dialog";
import { TournamentsAllTable } from "./_components/tournaments-all-table";

export const dynamic = "force-dynamic";

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
  const championships = completed.filter(
    (row) => row.placement && /champion/i.test(row.placement),
  ).length;

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
        description="Every bracket run across your squads — live, planned, and archived."
        actions={
          canManage ? <TournamentFormDialog squads={squads} /> : undefined
        }
      />

      <StatStrip>
        <StatItem label="Ongoing" value={ongoing.length} hint="In progress" />
        <StatItem
          label="Upcoming"
          value={upcoming.length}
          hint="On the calendar"
        />
        <StatItem
          label="Completed"
          value={completed.length}
          hint="Runs archived"
        />
        <StatItem
          label="Championships"
          value={championships}
          hint="First-place finishes"
        />
      </StatStrip>

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
              <p className="border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                {group.empty}
              </p>
            ) : (
              <div className="grid gap-3 desktop:grid-cols-2">
                {group.rows.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
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
