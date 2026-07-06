import { and, desc, gte, inArray, isNull, or } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { getMemberSquadIds } from "@/server/authz";
import {
  announcements,
  db,
  events,
  scrims,
  squads,
  tournaments,
} from "@/server/db";
import {
  EmptyState,
  HomeListItem,
  HomePanel,
  StatCard,
  StatGrid,
} from "./widgets";

export async function SquadHome({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const squadIds = await getMemberSquadIds(userId);
  const now = new Date();

  const [mySquads, upcoming, news, squadMatches, squadTournaments] =
    await Promise.all([
      squadIds.length
        ? db.query.squads.findMany({
            where: inArray(squads.id, squadIds),
            with: { members: true },
          })
        : Promise.resolve([]),
      db
        .select()
        .from(events)
        .where(
          and(
            gte(events.startsAt, now),
            squadIds.length
              ? or(isNull(events.squadId), inArray(events.squadId, squadIds))
              : isNull(events.squadId),
          ),
        )
        .orderBy(events.startsAt)
        .limit(4),
      db.query.announcements.findMany({
        where: squadIds.length
          ? or(
              isNull(announcements.squadId),
              inArray(announcements.squadId, squadIds),
            )
          : isNull(announcements.squadId),
        orderBy: desc(announcements.createdAt),
        limit: 3,
        with: { squad: true },
      }),
      squadIds.length
        ? db.query.scrims.findMany({
            where: inArray(scrims.squadId, squadIds),
            orderBy: desc(scrims.date),
            limit: 5,
            with: { squad: true },
          })
        : Promise.resolve([]),
      squadIds.length
        ? db.query.tournaments.findMany({
            where: inArray(tournaments.squadId, squadIds),
            orderBy: desc(tournaments.date),
            limit: 5,
            with: { squad: true },
          })
        : Promise.resolve([]),
    ]);

  const memberCount = mySquads.reduce(
    (total, squad) => total + squad.members.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {isLeader ? "Leader Dashboard" : "Member Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLeader
            ? "Squad overview for roster, schedules, matches, and tournaments."
            : "Player overview for squad updates, schedules, and match activity."}
        </p>
      </div>

      <StatGrid>
        <StatCard
          label="My Squads"
          value={mySquads.length}
          icon={Icons.Stats.Squads}
          hint={
            mySquads.map((squad) => squad.name).join(", ") || "No squad yet"
          }
        />
        <StatCard
          label="Teammates"
          value={memberCount}
          icon={Icons.Domain.Members}
          hint="Across your squads"
        />
        <StatCard
          label="Upcoming Events"
          value={upcoming.length}
          icon={Icons.Domain.Calendar}
          hint="Next on the schedule"
        />
        <StatCard
          label="Recent Matches"
          value={squadMatches.length}
          icon={Icons.Domain.Scrims}
          hint="Latest scrims and matches"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <HomePanel
          title="Upcoming Schedule"
          description="Org-wide and squad events"
          action={{ href: "/dashboard/schedules", label: "View all" }}
        >
          {upcoming.length === 0 && (
            <EmptyState message="No upcoming events." />
          )}
          {upcoming.map((event) => (
            <HomeListItem
              key={event.id}
              title={event.title}
              meta={formatDateTime(event.startsAt)}
              trailing={
                <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Recent Matches"
          description="Latest scrim results"
          action={{ href: "/dashboard/matches", label: "View all" }}
        >
          {squadMatches.length === 0 && (
            <EmptyState message="No matches recorded yet." />
          )}
          {squadMatches.map((match) => (
            <HomeListItem
              key={match.id}
              title={`vs ${match.opponent}`}
              meta={`${match.squad.name} · ${formatDate(match.date)}`}
              trailing={
                match.result ? (
                  <Badge variant="secondary">{match.result}</Badge>
                ) : undefined
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Tournaments"
          description="Your squads' tournament runs"
          action={{ href: "/dashboard/tournaments", label: "View all" }}
        >
          {squadTournaments.length === 0 && (
            <EmptyState message="No tournaments yet." />
          )}
          {squadTournaments.map((tournament) => (
            <HomeListItem
              key={tournament.id}
              href={`/dashboard/tournaments/${tournament.id}`}
              title={tournament.name}
              meta={`${tournament.squad?.name ?? "Unassigned"} · ${formatDate(tournament.date)}`}
              trailing={
                tournament.result ? (
                  <Badge variant="secondary">{tournament.result}</Badge>
                ) : undefined
              }
            />
          ))}
        </HomePanel>
      </div>

      {news.length > 0 && (
        <HomePanel
          title="Announcements"
          description="Latest updates for your squads"
        >
          {news.map((item) => (
            <HomeListItem
              key={item.id}
              title={item.title}
              meta={`${item.squad?.name ?? "Organization"} · ${formatDate(item.createdAt)}`}
            />
          ))}
        </HomePanel>
      )}
    </div>
  );
}
