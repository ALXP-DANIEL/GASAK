import { endOfMonth, startOfMonth } from "date-fns";
import { and, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import {
  DashboardListItem,
  DashboardPanel,
  EmptyState,
  StatCard,
} from "@/components/dashboard/widgets";
import { Icons } from "@/components/icons";
import { BrandBadge } from "@/components/ui/brand";
import { Button } from "@/components/ui/shadcn/button";
import { formatDate, formatTime } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  LANE_LABELS,
  SQUAD_ROLE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { getMemberSquadIds } from "@/server/authz";
import {
  announcements,
  applications,
  db,
  events,
  scrims,
  squads,
  tournaments,
  user as users,
} from "@/server/db";
import type { ApplicationStatus, EventType } from "@/server/db/schema";

export async function SquadDashboard({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const squadIds = await getMemberSquadIds(userId);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    mySquads,
    upcoming,
    news,
    squadScrims,
    squadTournaments,
    recruitmentQueue,
    currentUser,
  ] = await Promise.all([
    squadIds.length
      ? db.query.squads.findMany({
          where: inArray(squads.id, squadIds),
          with: {
            members: { with: { user: { with: { profile: true } } } },
          },
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
      with: { squad: true, author: true },
    }),
    squadIds.length
      ? db.query.scrims.findMany({
          where: inArray(scrims.squadId, squadIds),
          orderBy: desc(scrims.date),
          limit: 8,
          with: { squad: true },
        })
      : Promise.resolve([]),
    squadIds.length
      ? db.query.tournaments.findMany({
          where: inArray(tournaments.squadId, squadIds),
          orderBy: desc(tournaments.date),
          limit: 8,
          with: { squad: true },
        })
      : Promise.resolve([]),
    isLeader
      ? db.query.applications.findMany({
          where: eq(applications.assignedLeaderId, userId),
          orderBy: desc(applications.createdAt),
          limit: 5,
        })
      : Promise.resolve([]),
    db.query.user.findFirst({
      where: eq(users.id, userId),
      with: { profile: true },
    }),
  ]);

  const primarySquad = mySquads[0];
  const activeMembers = primarySquad?.members.length ?? 0;
  const thisMonthScrims = squadScrims.filter((scrim) =>
    isWithin(scrim.date, monthStart, monthEnd),
  );
  const thisMonthTournaments = squadTournaments.filter((tournament) =>
    isWithin(tournament.date, monthStart, monthEnd),
  );
  const wins = squadScrims.filter((scrim) => isWin(scrim.result)).length;
  const losses = squadScrims.filter((scrim) => isLoss(scrim.result)).length;
  const draws = squadScrims.filter((scrim) => isDraw(scrim.result)).length;
  const totalMatches = wins + losses + draws;
  const winRate = totalMatches
    ? Math.round((wins / totalMatches) * 1000) / 10
    : 0;
  const currentMember = primarySquad?.members.find(
    (member) => member.userId === userId,
  );

  if (!isLeader) {
    return (
      <MemberDashboard
        currentUser={currentUser}
        squad={primarySquad}
        member={currentMember}
        upcoming={upcoming}
        announcements={news}
        scrims={squadScrims}
        tournaments={squadTournaments}
        thisMonthScrims={thisMonthScrims}
        rank={primarySquad ? rankSquad(primarySquad.id, mySquads) : null}
        wins={wins}
        losses={losses}
        draws={draws}
        totalMatches={totalMatches}
        winRate={winRate}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <LeaderHero
        isLeader={isLeader}
        squadName={primarySquad?.name}
        squadSlug={primarySquad?.slug}
        logoUrl={primarySquad?.logoUrl}
        memberCount={activeMembers}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Squad Rank"
          value={
            primarySquad ? `#${rankSquad(primarySquad.id, mySquads)}` : "-"
          }
          Icon={Icons.Domain.Squads}
          hint={`Out of ${Math.max(mySquads.length, 1)} squad${mySquads.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Upcoming Events"
          value={upcoming.length}
          Icon={Icons.Domain.Calendar}
          hint="This week"
        />
        <StatCard
          label="Scrims This Month"
          value={thisMonthScrims.length}
          Icon={Icons.Domain.Scrims}
          hint={`${wins}W - ${losses}L - ${draws}D`}
        />
        <StatCard
          label="Tournaments"
          value={thisMonthTournaments.length}
          Icon={Icons.Stats.Trophies}
          hint="This month"
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          Icon={Icons.Stats.Goal}
          hint="Recorded scrims"
        />
        <StatCard
          label="Total Matches"
          value={totalMatches}
          Icon={Icons.Domain.Players}
          hint="Recorded scrims"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
        <LeaderEventsPanel events={upcoming} />
        <LeaderAnnouncementsPanel announcements={news} />
        <RecruitmentPanel applications={recruitmentQueue} isLeader={isLeader} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr_1.15fr]">
        <PerformancePanel wins={wins} losses={losses} draws={draws} />
        <RecentScrimsPanel scrims={squadScrims.slice(0, 3)} />
        <MembersPanel squad={primarySquad} />
      </div>
    </div>
  );
}

function MemberDashboard({
  currentUser,
  squad,
  member,
  upcoming,
  announcements: announcementItems,
  scrims: scrimItems,
  tournaments: tournamentItems,
  thisMonthScrims,
  rank,
  wins,
  losses,
  draws,
  totalMatches,
  winRate,
}: {
  currentUser:
    | {
        name: string;
        image: string | null;
        profile: {
          ign: string | null;
          mlbbId: string | null;
          serverId: string | null;
          preferredLane: keyof typeof LANE_LABELS | null;
          currentRank: string | null;
          peakRank: string | null;
        } | null;
      }
    | undefined;
  squad:
    | (typeof squads.$inferSelect & {
        members: {
          id: string;
          userId: string;
          squadRole: keyof typeof SQUAD_ROLE_LABELS;
          user: {
            name: string;
            image: string | null;
            profile: {
              ign: string | null;
              preferredLane: keyof typeof LANE_LABELS | null;
            } | null;
          };
        }[];
      })
    | undefined;
  member:
    | {
        squadRole: keyof typeof SQUAD_ROLE_LABELS;
        user: {
          name: string;
          image: string | null;
          profile: {
            preferredLane: keyof typeof LANE_LABELS | null;
          } | null;
        };
      }
    | undefined;
  upcoming: (typeof events.$inferSelect)[];
  announcements: (typeof announcements.$inferSelect & {
    squad: typeof squads.$inferSelect | null;
    author: { name: string } | null;
  })[];
  scrims: (typeof scrims.$inferSelect & {
    squad: typeof squads.$inferSelect;
  })[];
  tournaments: (typeof tournaments.$inferSelect & {
    squad: typeof squads.$inferSelect | null;
  })[];
  thisMonthScrims: (typeof scrims.$inferSelect & {
    squad: typeof squads.$inferSelect;
  })[];
  rank: number | null;
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  winRate: number;
}) {
  const profile = currentUser?.profile;
  const displayName = profile?.ign || currentUser?.name || "Member";
  const mainRole = profile?.preferredLane
    ? LANE_LABELS[profile.preferredLane]
    : member
      ? SQUAD_ROLE_LABELS[member.squadRole]
      : "Member";
  const upcomingTournament =
    tournamentItems.find((tournament) => tournament.date >= new Date()) ??
    tournamentItems[0];

  return (
    <div className="grid gap-5">
      <MemberHero name={displayName} squadName={squad?.name} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MemberInfoCard
          label="My Squad"
          value={squad?.name ?? "Unassigned"}
          hint={`Role: ${member ? SQUAD_ROLE_LABELS[member.squadRole] : "Member"}`}
          Icon={Icons.Stats.Trophies}
        />
        <StatCard
          label="Squad Rank"
          value={rank ? `#${rank}` : "-"}
          Icon={Icons.Stats.Trophies}
          hint={`Out of ${squad ? 1 : 0} squad${squad ? "" : "s"}`}
        />
        <StatCard
          label="Upcoming Events"
          value={upcoming.length}
          Icon={Icons.Domain.Calendar}
          hint="This week"
        />
        <StatCard
          label="Total Matches"
          value={thisMonthScrims.length}
          Icon={Icons.Domain.Scrims}
          hint={`${wins}W - ${losses}L - ${draws}D`}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          Icon={Icons.Stats.Goal}
          hint={winRate ? "Great job!" : "No results yet"}
        />
        <StatCard
          label="My Role"
          value={mainRole}
          Icon={Icons.Stats.Players}
          hint={profile?.preferredLane ? "Main lane" : "Squad role"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_1.1fr]">
        <LeaderEventsPanel events={upcoming} />
        <LeaderAnnouncementsPanel announcements={announcementItems} />
        <MemberProfilePanel
          user={currentUser}
          squadRole={member?.squadRole}
          totalMatches={totalMatches}
          winRate={winRate}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <MemberRecentScrimsPanel scrims={scrimItems.slice(0, 5)} />
        <UpcomingTournamentPanel tournament={upcomingTournament} />
      </div>
    </div>
  );
}

function MemberHero({ name, squadName }: { name: string; squadName?: string }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card px-5 py-8 shadow-[0_0_50px_oklch(0.78_0.14_85_/_0.1)] md:px-7">
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/25" />
      <div className="relative max-w-2xl">
        <h1 className="font-heading text-3xl font-black tracking-wide md:text-4xl">
          {timeGreeting()}, {name}!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stay focused, keep improving, and make {squadName ?? "GASAK"} proud.
        </p>
      </div>
    </section>
  );
}

function MemberInfoCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: typeof Icons.Stats.Trophies;
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="rounded border border-primary/35 bg-primary/10 p-2.5 text-primary">
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-heading text-xl font-bold tracking-wide">
            {value}
          </p>
          <p className="truncate text-xs text-primary">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function MemberProfilePanel({
  user,
  squadRole,
  totalMatches,
  winRate,
}: {
  user:
    | {
        name: string;
        image: string | null;
        profile: {
          ign: string | null;
          mlbbId: string | null;
          serverId: string | null;
          preferredLane: keyof typeof LANE_LABELS | null;
          currentRank: string | null;
          peakRank: string | null;
        } | null;
      }
    | undefined;
  squadRole?: keyof typeof SQUAD_ROLE_LABELS;
  totalMatches: number;
  winRate: number;
}) {
  const profile = user?.profile;
  const role = profile?.preferredLane
    ? LANE_LABELS[profile.preferredLane]
    : squadRole
      ? SQUAD_ROLE_LABELS[squadRole]
      : "Member";

  return (
    <DashboardPanel
      title="My Profile"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/profile">Edit Profile</Link>
        </Button>
      }
    >
      <div className="grid gap-5">
        <div className="flex items-center gap-4">
          <Image
            src={user?.image || "/images/gasak-logo.png"}
            alt=""
            width={88}
            height={88}
            className="size-20 rounded-full border border-primary/35 object-cover"
            unoptimized={Boolean(user?.image)}
          />
          <div className="min-w-0">
            <p className="truncate font-heading text-2xl font-bold">
              {profile?.ign || user?.name || "Member"}
            </p>
            <p className="text-sm text-muted-foreground">
              IGN: {profile?.ign || "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              MLBB ID: {profile?.mlbbId || "-"}
              {profile?.serverId ? ` (${profile.serverId})` : ""}
            </p>
            <p className="text-sm text-muted-foreground">Role: {role}</p>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-primary/20 sm:grid-cols-2">
          <ProfileMetric label="Current Rank" value={profile?.currentRank} />
          <ProfileMetric label="Peak Rank" value={profile?.peakRank} />
          <ProfileMetric label="Matches" value={String(totalMatches)} />
          <ProfileMetric label="Win Rate" value={`${winRate}%`} highlight />
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">Favorite Heroes</p>
          <div className="flex items-center gap-2">
            {["A", "M", "J", "G", "R"].map((hero) => (
              <div
                key={hero}
                className="grid size-10 place-items-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary"
              >
                {hero}
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="ml-auto">
              <Link href="/dashboard/profile">View All</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function ProfileMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="border border-primary/15 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold",
          highlight ? "text-emerald-400" : "text-foreground",
        )}
      >
        {value || "-"}
      </p>
    </div>
  );
}

function MemberRecentScrimsPanel({
  scrims: items,
}: {
  scrims: (typeof scrims.$inferSelect & {
    squad: typeof squads.$inferSelect;
  })[];
}) {
  return (
    <DashboardPanel
      title="Recent Scrims"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/scrims">View All</Link>
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="border-b border-primary/15">
              <th className="py-2 font-medium">Opponent</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Result</th>
              <th className="py-2 font-medium">Score</th>
              <th className="py-2 font-medium">Replay</th>
            </tr>
          </thead>
          <tbody>
            {items.map((scrim) => (
              <tr key={scrim.id} className="border-b border-primary/10">
                <td className="py-2">{scrim.opponent}</td>
                <td className="py-2 text-muted-foreground">
                  {formatDate(scrim.date)}
                </td>
                <td className="py-2">
                  <ResultBadge result={scrim.result} />
                </td>
                <td className="py-2">{scrimScore(scrim.result)}</td>
                <td className="py-2">
                  {scrim.replayLink ? (
                    <Link
                      href={scrim.replayLink}
                      className="text-primary hover:text-primary/80"
                    >
                      Open
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="mt-4">
            <EmptyState message="No scrims recorded yet." />
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}

function UpcomingTournamentPanel({
  tournament,
}: {
  tournament:
    | (typeof tournaments.$inferSelect & {
        squad: typeof squads.$inferSelect | null;
      })
    | undefined;
}) {
  return (
    <DashboardPanel
      title="Upcoming Tournament"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/tournaments">View Details</Link>
        </Button>
      }
    >
      {tournament ? (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-primary/20 bg-primary/10">
            <Image
              src={tournament.screenshotUrl || "/images/hero.png"}
              alt=""
              fill
              className="object-cover"
              unoptimized={Boolean(tournament.screenshotUrl)}
            />
          </div>
          <div className="grid content-center gap-2">
            <h3 className="font-heading text-2xl font-bold">
              {tournament.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(tournament.date)}
            </p>
            <p className="text-sm text-muted-foreground">
              {tournament.squad?.name ?? "GASAK"} ·{" "}
              {tournament.organizer ?? "Tournament"}
            </p>
            <BrandBadge className="w-fit bg-emerald-500/20 text-emerald-200">
              {tournament.date >= new Date() ? "Upcoming" : "Recorded"}
            </BrandBadge>
          </div>
        </div>
      ) : (
        <EmptyState message="No tournaments recorded yet." />
      )}
    </DashboardPanel>
  );
}

function LeaderHero({
  isLeader,
  squadName,
  squadSlug,
  logoUrl,
  memberCount,
}: {
  isLeader: boolean;
  squadName?: string;
  squadSlug?: string;
  logoUrl?: string | null;
  memberCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-primary/25 bg-card px-5 py-6 shadow-[0_0_50px_oklch(0.78_0.14_85_/_0.1)] md:px-7">
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/82 to-background/30" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <Image
          src={logoUrl || "/images/gasak-logo.png"}
          alt=""
          width={96}
          height={96}
          className="size-20 rounded-full border border-primary/35 object-cover shadow-[0_0_24px_oklch(0.78_0.14_85_/_0.25)] md:size-24"
          unoptimized={Boolean(logoUrl)}
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl font-black tracking-wide md:text-4xl">
            Welcome back, {isLeader ? "Leader" : "Member"}
            {squadName ? ` ${squadName}` : ""}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with{" "}
            {squadName ?? "your GASAK squad"} today.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <BrandBadge className="bg-background/65">
              Role: {isLeader ? "Leader" : "Member"}
            </BrandBadge>
            <BrandBadge className="bg-background/65">
              Squad: {squadName ?? "Unassigned"}
            </BrandBadge>
            <BrandBadge className="bg-background/65">
              Members: {memberCount}
            </BrandBadge>
          </div>
        </div>
        {squadSlug ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/my-squad">View Squad</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function LeaderEventsPanel({
  events: items,
}: {
  events: (typeof events.$inferSelect)[];
}) {
  return (
    <DashboardPanel
      title="Upcoming Events"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/calendar">View Calendar</Link>
        </Button>
      }
    >
      <div className="grid gap-3">
        {items.map((event) => (
          <DashboardListItem
            key={event.id}
            title={
              <span className="flex items-center gap-2">
                {event.title}
                <EventBadge type={event.type} />
              </span>
            }
            description={`${formatDate(event.startsAt)} · ${formatTime(event.startsAt)}${event.endsAt ? ` - ${formatTime(event.endsAt)}` : ""}${event.location ? ` · ${event.location}` : ""}`}
            badge={
              <span className="text-xs font-semibold text-emerald-400">
                {EVENT_TYPE_LABELS[event.type]}
              </span>
            }
          />
        ))}
        {items.length === 0 && <EmptyState message="No upcoming events." />}
      </div>
    </DashboardPanel>
  );
}

function LeaderAnnouncementsPanel({
  announcements: items,
}: {
  announcements: (typeof announcements.$inferSelect & {
    squad: typeof squads.$inferSelect | null;
    author: { name: string } | null;
  })[];
}) {
  return (
    <DashboardPanel
      title="Recent Announcements"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/announcements">View All</Link>
        </Button>
      }
    >
      <div className="grid gap-3">
        {items.map((item) => (
          <DashboardListItem
            key={item.id}
            title={item.title}
            description={
              <span className="line-clamp-2 whitespace-normal">
                {item.content}
              </span>
            }
            badge={<BrandBadge>{item.squad?.name ?? "Global"}</BrandBadge>}
          >
            <p className="mt-2 text-xs text-muted-foreground">
              {item.author?.name ?? "GASAK"} · {formatDate(item.createdAt)}
            </p>
          </DashboardListItem>
        ))}
        {items.length === 0 && <EmptyState message="No announcements yet." />}
      </div>
    </DashboardPanel>
  );
}

function RecruitmentPanel({
  applications: items,
  isLeader,
}: {
  applications: (typeof applications.$inferSelect)[];
  isLeader: boolean;
}) {
  return (
    <DashboardPanel
      title="Recruitment Applications"
      action={
        isLeader ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/recruitment">View All</Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-3">
        {!isLeader ? (
          <EmptyState message="Recruitment reviews are available to squad leaders." />
        ) : null}
        {items.map((item) => (
          <DashboardListItem
            key={item.id}
            title={item.fullName}
            description={`${item.currentRank} · ${LANE_LABELS[item.preferredLane]}`}
            badge={<StatusBadge status={item.status} />}
          />
        ))}
        {isLeader && items.length === 0 ? (
          <EmptyState message="No assigned applications." />
        ) : null}
      </div>
    </DashboardPanel>
  );
}

function PerformancePanel({
  wins,
  losses,
  draws,
}: {
  wins: number;
  losses: number;
  draws: number;
}) {
  const total = wins + losses + draws;
  const segments = [
    { label: "Wins", value: wins, color: "bg-emerald-500" },
    { label: "Losses", value: losses, color: "bg-red-500" },
    { label: "Draws", value: draws, color: "bg-amber-500" },
  ];

  return (
    <DashboardPanel
      title={
        <>
          Squad Performance{" "}
          <span className="text-base font-normal text-muted-foreground">
            (Recorded)
          </span>
        </>
      }
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/scrims">View Statistics</Link>
        </Button>
      }
    >
      <div className="grid gap-5 md:grid-cols-[160px_1fr] md:items-center">
        <div
          className="grid aspect-square place-items-center rounded-full"
          style={{
            background: total
              ? `conic-gradient(oklch(0.72 0.17 150) 0 ${percent(wins, total)}%, oklch(0.64 0.22 25) ${percent(wins, total)}% ${percent(wins + losses, total)}%, oklch(0.78 0.14 85) ${percent(wins + losses, total)}% 100%)`
              : "oklch(0.22 0.02 250)",
          }}
        >
          <div className="grid size-24 place-items-center rounded-full bg-background text-center">
            <div>
              <p className="font-heading text-3xl font-black">{total}</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center gap-3 text-sm"
            >
              <span className={cn("size-3 rounded-full", segment.color)} />
              <span className="flex-1">{segment.label}</span>
              <span className="text-muted-foreground">
                {segment.value} ({total ? percent(segment.value, total) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  );
}

function RecentScrimsPanel({
  scrims: items,
}: {
  scrims: (typeof scrims.$inferSelect & {
    squad: typeof squads.$inferSelect;
  })[];
}) {
  return (
    <DashboardPanel
      title="Recent Scrims"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/scrims">View All</Link>
        </Button>
      }
    >
      <div className="grid gap-3">
        {items.map((scrim) => (
          <DashboardListItem
            key={scrim.id}
            title={`vs ${scrim.opponent}`}
            description={`${scrim.squad.name} · ${formatDate(scrim.date)}`}
            badge={<ResultBadge result={scrim.result} />}
          />
        ))}
        {items.length === 0 && <EmptyState message="No scrims recorded yet." />}
      </div>
    </DashboardPanel>
  );
}

function MembersPanel({
  squad,
}: {
  squad:
    | (typeof squads.$inferSelect & {
        members: {
          id: string;
          squadRole: string;
          user: {
            name: string;
            image?: string | null;
            profile?: {
              ign: string | null;
              preferredLane: keyof typeof LANE_LABELS | null;
            } | null;
          };
        }[];
      })
    | undefined;
}) {
  const members = squad?.members.slice(0, 5) ?? [];
  const extra = Math.max((squad?.members.length ?? 0) - members.length, 0);

  return (
    <DashboardPanel
      title="Squad Members Overview"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/my-squad">View All</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="grid min-h-36 place-items-center rounded-lg border border-primary/15 bg-background/35 p-3 text-center"
          >
            <Image
              src={member.user.image || "/images/gasak-logo.png"}
              alt=""
              width={56}
              height={56}
              className="size-14 rounded-full border border-primary/35 object-cover"
              unoptimized={Boolean(member.user.image)}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {member.user.profile?.ign ?? member.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.user.profile?.preferredLane
                  ? LANE_LABELS[member.user.profile.preferredLane]
                  : SQUAD_ROLE_LABELS[
                      member.squadRole as keyof typeof SQUAD_ROLE_LABELS
                    ]}
              </p>
            </div>
          </div>
        ))}
        {extra > 0 ? (
          <div className="grid min-h-36 place-items-center rounded-lg border border-primary/15 bg-background/35 p-3 text-center">
            <p className="font-heading text-2xl font-bold">+{extra}</p>
            <p className="text-xs text-muted-foreground">More</p>
          </div>
        ) : null}
        {!squad ? <EmptyState message="No squad assigned yet." /> : null}
      </div>
    </DashboardPanel>
  );
}

function EventBadge({ type }: { type: EventType }) {
  const className = {
    practice: "bg-purple-500/20 text-purple-200",
    scrim: "bg-amber-500/20 text-amber-200",
    meeting: "bg-sky-500/20 text-sky-200",
    tournament: "bg-red-500/20 text-red-200",
  }[type];

  return (
    <BrandBadge className={className}>{EVENT_TYPE_LABELS[type]}</BrandBadge>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const className = {
    applied: "bg-emerald-500/20 text-emerald-200",
    under_review: "bg-amber-500/20 text-amber-200",
    trial: "bg-sky-500/20 text-sky-200",
    accepted: "bg-emerald-500/20 text-emerald-200",
    rejected: "bg-red-500/20 text-red-200",
  }[status];

  return (
    <BrandBadge className={className}>
      {APPLICATION_STATUS_LABELS[status]}
    </BrandBadge>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  const label = result ?? "Pending";
  const className = isWin(result)
    ? "bg-emerald-500/20 text-emerald-200"
    : isLoss(result)
      ? "bg-red-500/20 text-red-200"
      : "bg-muted text-muted-foreground";

  return <BrandBadge className={className}>{label}</BrandBadge>;
}

function isWithin(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function isWin(result: string | null) {
  return result?.toLowerCase().includes("won") ?? false;
}

function isLoss(result: string | null) {
  return result?.toLowerCase().includes("lost") ?? false;
}

function isDraw(result: string | null) {
  return result?.toLowerCase().includes("draw") ?? false;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function scrimScore(result: string | null) {
  return result?.match(/\d+\s*-\s*\d+/)?.[0] ?? "-";
}

function rankSquad(
  squadId: string,
  rows: { id: string; members: unknown[] }[],
) {
  const sorted = [...rows].sort((a, b) => b.members.length - a.members.length);
  return sorted.findIndex((squad) => squad.id === squadId) + 1 || 1;
}
