import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Accent } from "@/components/accent";
import { BrandBadge, BrandCard, SectionHeader } from "@/components/ui/brand";
import { formatDate } from "@/lib/format";
import { LANE_LABELS, SQUAD_ROLE_LABELS } from "@/lib/labels";
import { db, scrims, squads, tournaments } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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

  const roleOrder = { leader: 0, coach: 1, player: 2, reserve: 3 } as const;
  const roster = [...squad.members].sort(
    (a, b) => roleOrder[a.squadRole] - roleOrder[b.squadRole],
  );

  return (
    <Accent color={squad.accentColor}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Squad Profile
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide desktop:text-4xl">
              {squad.name}
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {squad.description}
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeader align="left" title="Roster" />
          <div className="grid gap-4 desktop:grid-cols-3">
            {roster.map((member) => (
              <BrandCard key={member.id} className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold tracking-wide">
                    {member.user.profile?.ign ?? member.user.name}
                  </h2>
                  <BrandBadge
                    className={
                      member.squadRole === "leader"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                  >
                    {SQUAD_ROLE_LABELS[member.squadRole]}
                  </BrandBadge>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>{member.user.name}</p>
                  {member.user.profile?.preferredLane && (
                    <p>{LANE_LABELS[member.user.profile.preferredLane]}</p>
                  )}
                  {member.user.profile?.currentRank && (
                    <p>{member.user.profile.currentRank}</p>
                  )}
                </div>
              </BrandCard>
            ))}
            {roster.length === 0 && (
              <p className="text-muted-foreground">
                Roster forming — check back soon.
              </p>
            )}
          </div>
        </section>

        {recentTournaments.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeader align="left" title="Tournament history" />
            <div className="grid gap-3">
              {recentTournaments.map((t) => (
                <BrandCard
                  key={t.id}
                  className="flex flex-col justify-between gap-3 p-5 desktop:flex-row desktop:items-center"
                >
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(t.date)}
                      {t.opponent ? ` · vs ${t.opponent}` : ""}
                    </p>
                  </div>
                  {t.result && <BrandBadge>{t.result}</BrandBadge>}
                </BrandCard>
              ))}
            </div>
          </section>
        )}

        {recentScrims.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeader align="left" title="Recent scrims" />
            <div className="grid gap-3">
              {recentScrims.map((s) => (
                <BrandCard
                  key={s.id}
                  className="flex flex-col justify-between gap-3 p-5 desktop:flex-row desktop:items-center"
                >
                  <div>
                    <p className="font-semibold">vs {s.opponent}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(s.date)}
                    </p>
                  </div>
                  {s.result && <BrandBadge>{s.result}</BrandBadge>}
                </BrandCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </Accent>
  );
}
