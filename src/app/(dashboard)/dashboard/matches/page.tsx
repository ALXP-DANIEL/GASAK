import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { listMatches } from "@features/matches/queries";
import { listManagedSquadOptions } from "@features/squads/queries";
import { getMemberSquadIds } from "@server/authz";
import { requireDashboardRole } from "../_components/dashboard-section";
import { FormStrip } from "./_components/form-strip";
import { MatchFormDialog } from "./_components/match-form-dialog";
import { MatchesTable } from "./_components/matches-table";

export default async function MatchesPage() {
  const { user, role } = await requireDashboardRole();
  const squadIds =
    role === "admin" ? undefined : await getMemberSquadIds(user.id);
  const [rows, squads] = await Promise.all([
    listMatches(squadIds),
    listManagedSquadOptions(role, user.id),
  ]);
  const canManage = squads.length > 0;
  const squadFilterOptions = Array.from(
    new Set(rows.map((row) => row.squad.name)),
  ).map((value) => ({ value, label: value }));

  const wins = rows.filter(
    (row) => row.result && /^won?\b/i.test(row.result),
  ).length;
  const losses = rows.filter(
    (row) => row.result && /^lost?\b/i.test(row.result),
  ).length;
  const decided = wins + losses;
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matches"
        kicker="Squad"
        icon={Icons.Domain.Scrims}
        description="Scrim and match records for your squads."
        actions={canManage ? <MatchFormDialog squads={squads} /> : undefined}
      />

      <StatStrip>
        <StatItem
          label="Played"
          value={rows.length}
          hint="All records"
          icon={Icons.Domain.Scrims}
        />
        <StatItem
          label="Wins"
          value={wins}
          hint="Recorded wins"
          icon={Icons.Stats.Trophies}
        />
        <StatItem
          label="Losses"
          value={losses}
          hint="Recorded losses"
          icon={Icons.Status.Failed}
        />
        <StatItem
          label="Win Rate"
          value={winRate === null ? "—" : `${winRate}%`}
          hint={decided > 0 ? `${decided} decided matches` : "No results yet"}
          icon={Icons.Stats.Goal}
        />
      </StatStrip>

      <FormStrip
        matches={rows.map((row) => ({
          id: row.id,
          opponent: row.opponent,
          result: row.result,
          date: row.date,
        }))}
      />

      <MatchesTable rows={rows} squadFilterOptions={squadFilterOptions} />
    </div>
  );
}
