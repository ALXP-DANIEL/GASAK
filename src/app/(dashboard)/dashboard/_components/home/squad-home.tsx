import { Icons } from "@components/icons";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { Badge } from "@components/ui/shadcn/badge";
import { formatDate, formatMY } from "@lib/format";
import { EVENT_TYPE_LABELS, resultBadgeVariant } from "@lib/labels";
import { getMemberSquadIds } from "@server/authz";
import { db, events, news, scrims, squads, tournaments } from "@server/db";
import { and, desc, gte, inArray, isNull, or } from "drizzle-orm";
import { PageHeader } from "../page-surface";
import { EmptyState, HomeListItem, HomePanel } from "./widgets";

export async function SquadHome({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const squadIds = await getMemberSquadIds(userId);
  const now = new Date();
  const todayStr = formatMY(now, "yyyy-MM-dd");

  const [mySquads, upcoming, newsItems, squadMatches, squadTournaments] =
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
            gte(events.date, todayStr),
            squadIds.length
              ? or(isNull(events.squadId), inArray(events.squadId, squadIds))
              : isNull(events.squadId),
          ),
        )
        .orderBy(events.date)
        .limit(6),
      db.query.news.findMany({
        where: squadIds.length
          ? or(isNull(news.squadId), inArray(news.squadId, squadIds))
          : isNull(news.squadId),
        orderBy: desc(news.createdAt),
        limit: 4,
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
            limit: 4,
            with: { squad: true },
          })
        : Promise.resolve([]),
    ]);

  const memberCount = mySquads.reduce(
    (total, squad) => total + squad.members.length,
    0,
  );
  const recentWins = squadMatches.filter(
    (match) => match.result && /^won?\b/i.test(match.result),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isLeader ? "Leader Dashboard" : "Member Dashboard"}
        kicker={`Overview — ${formatMY(now, "EEEE, d MMMM")}`}
        icon={Icons.Stats.Squads}
        description={
          isLeader
            ? "Squad overview for roster, schedules, matches, and tournaments."
            : "Player overview for squad updates, schedules, and match activity."
        }
      />

      <StatStrip>
        <StatItem
          label="My Squads"
          value={mySquads.length}
          hint={
            mySquads.map((squad) => squad.name).join(", ") || "No squad yet"
          }
          icon={Icons.Stats.Squads}
        />
        <StatItem
          label="Teammates"
          value={memberCount}
          hint="Across your squads"
          icon={Icons.Domain.Members}
        />
        <StatItem
          label="Upcoming Events"
          value={upcoming.length}
          hint="Next on the schedule"
          icon={Icons.Domain.Calendar}
        />
        <StatItem
          label="Recent Form"
          value={`${recentWins}W–${squadMatches.length - recentWins}L`}
          hint={`Last ${squadMatches.length} matches`}
          icon={Icons.Stats.Trophies}
        />
      </StatStrip>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
        <HomePanel
          title="This Week"
          description="Org-wide and squad events, soonest first"
          action={{ href: "/dashboard/schedules", label: "Full schedule" }}
          className="desktop:col-span-2"
        >
          {upcoming.length === 0 && (
            <EmptyState message="No upcoming events." />
          )}
          {upcoming.map((event) => (
            <HomeListItem
              key={event.id}
              href={`/dashboard/schedules/${event.id}`}
              title={event.title}
              meta={`${formatDate(event.date)}${event.location ? ` · ${event.location}` : ""}`}
              trailing={
                <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="Recent Results"
          description="Latest scrims and matches"
          action={{ href: "/dashboard/matches", label: "View all" }}
        >
          {squadMatches.length === 0 && (
            <EmptyState message="No matches recorded yet." />
          )}
          {squadMatches.map((match) => (
            <HomeListItem
              key={match.id}
              href={`/dashboard/matches/${match.id}`}
              title={`vs ${match.opponent}`}
              meta={`${match.squad.name} · ${formatDate(match.date)}`}
              trailing={
                match.result ? (
                  <Badge variant={resultBadgeVariant(match.result)}>
                    {match.result}
                  </Badge>
                ) : (
                  <Badge variant="outline">No result</Badge>
                )
              }
            />
          ))}
        </HomePanel>
      </div>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
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
                tournament.placement ? (
                  <Badge variant="secondary">{tournament.placement}</Badge>
                ) : undefined
              }
            />
          ))}
        </HomePanel>

        <HomePanel
          title="News"
          description="Latest updates for your squads"
          action={{ href: "/dashboard/news", label: "View all" }}
        >
          {newsItems.length === 0 && <EmptyState message="No news yet." />}
          {newsItems.map((item) => (
            <HomeListItem
              key={item.id}
              href={`/dashboard/news/${item.id}`}
              title={item.title}
              meta={`${item.squad?.name ?? "Organization"} · ${formatDate(item.createdAt)}`}
            />
          ))}
        </HomePanel>
      </div>
    </div>
  );
}
