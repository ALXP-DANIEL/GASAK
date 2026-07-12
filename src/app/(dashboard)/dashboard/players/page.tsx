import {
  DashboardPanel,
  PageHeader,
} from "@app/(dashboard)/dashboard/_components/page-surface";
import { SegmentedBar } from "@components/charts/segmented-bar";
import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { listPlayers } from "@features/players/queries";
import { LANE_LABELS, LANE_ORDER, normalizeLanes } from "@lib/labels";
import { laneEnum } from "@server/db/schema";
import { requireDashboardRole } from "../_components/dashboard-section";
import { PlayersTable } from "./_components/players-table";

const laneFilterOptions = laneEnum.enumValues.map((value) => ({
  value,
  label: LANE_LABELS[value],
}));

export default async function PlayersPage() {
  await requireDashboardRole("admin");
  const rows = await listPlayers();

  const ranked = rows.filter((row) => row.currentRank).length;
  const laneCounts = LANE_ORDER.filter((lane) => lane !== "flex").map(
    (lane, index) => ({
      label: LANE_LABELS[lane],
      value: rows.filter((row) =>
        normalizeLanes(row.preferredLanes).includes(lane),
      ).length,
      color: `var(--chart-${index + 1})`,
    }),
  );
  const lanesCovered = laneCounts.filter((lane) => lane.value > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Players"
        kicker="Management"
        icon={Icons.Domain.Players}
        description="Registered player profiles."
      />

      <StatStrip>
        <StatItem
          label="Registered"
          value={rows.length}
          hint="Player profiles"
          icon={Icons.Domain.Players}
        />
        <StatItem
          label="Ranked"
          value={ranked}
          hint="Profiles with a current rank"
          icon={Icons.Stats.Trophies}
        />
        <StatItem
          label="Lanes Covered"
          value={`${lanesCovered}/5`}
          hint="Distinct preferred lanes"
          icon={Icons.Stats.Goal}
        />
      </StatStrip>

      <DashboardPanel
        title="Lane Coverage"
        description="Preferred lanes across all registered players"
      >
        <SegmentedBar title="Players per lane" segments={laneCounts} />
      </DashboardPanel>

      <PlayersTable rows={rows} laneFilterOptions={laneFilterOptions} />
    </div>
  );
}
