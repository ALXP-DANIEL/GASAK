import { inArray } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { LANE_LABELS, ROLE_LABELS } from "@/lib/labels";
import { requireRole, userRole } from "@/lib/session";
import { getLedSquadIds } from "@/server/authz";
import { db, type Role, squadMembers } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const actor = await requireRole("admin", "leader");
  const isAdmin = userRole(actor) === "admin";

  let players: Awaited<ReturnType<typeof queryAllUsers>>;
  if (isAdmin) {
    players = await queryAllUsers();
  } else {
    const ledSquadIds = await getLedSquadIds(actor.id);
    if (ledSquadIds.length === 0) {
      players = [];
    } else {
      const memberships = await db.query.squadMembers.findMany({
        where: inArray(squadMembers.squadId, ledSquadIds),
        with: {
          user: {
            with: { profile: true, memberships: { with: { squad: true } } },
          },
        },
      });
      const seen = new Set<string>();
      players = memberships
        .filter((m) => {
          if (seen.has(m.userId)) return false;
          seen.add(m.userId);
          return true;
        })
        .map((m) => m.user);
    }
  }

  return (
    <div>
      <PageHeader
        title="Players"
        description={
          isAdmin
            ? "All registered users and their player profiles."
            : "Members of the squads you lead."
        }
      />

      {players.length === 0 ? (
        <EmptyState message="No players found." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>IGN</TableHead>
                <TableHead className="hidden md:table-cell">Lane</TableHead>
                <TableHead className="hidden md:table-cell">Rank</TableHead>
                <TableHead className="hidden lg:table-cell">Squads</TableHead>
                {isAdmin && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.email}
                    </p>
                  </TableCell>
                  <TableCell>{player.profile?.ign ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.profile?.preferredLane
                      ? LANE_LABELS[player.profile.preferredLane]
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.profile?.currentRank ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {player.memberships.map((m) => (
                        <Badge key={m.id} variant="secondary">
                          {m.squad.name}
                        </Badge>
                      ))}
                      {player.memberships.length === 0 && (
                        <Badge variant="outline">
                          {ROLE_LABELS[(player.role ?? "member") as Role]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/players/${player.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function queryAllUsers() {
  return db.query.user.findMany({
    with: {
      profile: true,
      memberships: { with: { squad: true } },
    },
    orderBy: (u, { asc }) => asc(u.name),
  });
}
