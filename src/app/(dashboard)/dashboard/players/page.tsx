import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Card, CardContent } from "@components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { listPlayers } from "@features/players/queries";
import { LANE_LABELS } from "@lib/labels";
import Link from "next/link";
import { requireDashboardRole } from "../_components/dashboard-section";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  await requireDashboardRole("admin");
  const rows = await listPlayers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Players" description="Registered player profiles." />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No player profiles yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IGN</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((profile) => (
                  <TableRow key={profile.userId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/players/${profile.userId}`}
                        className="font-medium hover:underline"
                      >
                        {profile.user.name}
                      </Link>
                    </TableCell>
                    <TableCell>{profile.ign ?? "—"}</TableCell>
                    <TableCell>
                      {profile.preferredLane
                        ? LANE_LABELS[profile.preferredLane]
                        : "—"}
                    </TableCell>
                    <TableCell>{profile.currentRank ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
