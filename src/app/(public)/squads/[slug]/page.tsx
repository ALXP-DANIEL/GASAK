import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SquadAccent } from "@/components/squad-accent";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatDate } from "@/lib/format";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@/lib/labels";
import { db, scrims, squads, tournaments } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function SquadDetailPage(
  props: PageProps<"/squads/[slug]">,
) {
  const { slug } = await props.params;

  const squad = await db.query.squads.findFirst({
    where: eq(squads.slug, slug),
    with: {
      members: {
        with: {
          user: { with: { profile: true } },
        },
      },
    },
  });

  if (!squad || squad.archived) notFound();

  const [recentTournaments, recentScrims] = await Promise.all([
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.squadId, squad.id))
      .orderBy(desc(tournaments.date))
      .limit(5),
    db
      .select()
      .from(scrims)
      .where(eq(scrims.squadId, squad.id))
      .orderBy(desc(scrims.date))
      .limit(5),
  ]);

  const roleOrder = { leader: 0, coach: 1, member: 2, reserve: 3 } as const;
  const roster = [...squad.members].sort(
    (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
  );

  return (
    <SquadAccent color={squad.accentColor}>
      <div className="flex flex-col gap-10">
        {squad.bannerUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-2xl lg:h-56">
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          {squad.logoUrl && (
            <Image
              src={squad.logoUrl}
              alt={`${squad.name} logo`}
              width={64}
              height={64}
              className="rounded-full object-cover"
              unoptimized
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              {squad.name}
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {squad.description}
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Roster</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {member.user.profile?.ign ?? member.user.name}
                    </CardTitle>
                    <Badge
                      variant={
                        member.squadRole === "leader" ? "default" : "secondary"
                      }
                    >
                      {SQUAD_ROLE_LABELS[member.squadRole]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{member.user.name}</p>
                  {member.user.profile?.preferredLane && (
                    <p>{LANE_LABELS[member.user.profile.preferredLane]}</p>
                  )}
                  {member.user.profile?.currentRank && (
                    <p>{member.user.profile.currentRank}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {roster.length === 0 && (
              <p className="text-muted-foreground">
                Roster forming — apply now!
              </p>
            )}
          </div>
        </section>

        {recentTournaments.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Tournament history</h2>
            <div className="grid gap-3">
              {recentTournaments.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex flex-col justify-between gap-1 pt-6 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(t.date)}
                        {t.opponent ? ` · vs ${t.opponent}` : ""}
                      </p>
                    </div>
                    {t.result && <Badge variant="outline">{t.result}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {recentScrims.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Recent scrims</h2>
            <div className="grid gap-3">
              {recentScrims.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col justify-between gap-1 pt-6 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">vs {s.opponent}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(s.date)}
                      </p>
                    </div>
                    {s.result && <Badge variant="outline">{s.result}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </SquadAccent>
  );
}
