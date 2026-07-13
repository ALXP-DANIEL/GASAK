"use cache";

import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandCard, LinkButton } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";
import { db, playerProfiles, squads, tournaments } from "@server/db";
import { count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export const metadata = createPageMetadata({
  title: "About",
  description: "The story and values of GASAK Esports.",
  path: "/about",
  type: "About",
});

const VALUES = [
  {
    Icon: Icons.Stats.Goal,
    title: "Discipline",
    body: "Practice blocks, scrim reviews, and accountability keep every player moving with purpose.",
  },
  {
    Icon: Icons.Domain.Community,
    title: "Brotherhood",
    body: "Players, staff, academy talent, and supporters grow together instead of moving alone.",
  },
  {
    Icon: Icons.Stats.Squads,
    title: "Malaysia first",
    body: "The mission is to build local talent that can represent the country on bigger stages.",
  },
];

const PILLARS = [
  {
    title: "Competitive squads",
    description:
      "Rosters built for tournaments, scrims, reviews, and clear responsibilities.",
  },
  {
    title: "Academy pipeline",
    description:
      "Recruitment and trial workflows help rising players earn a place through measurable progress.",
  },
  {
    title: "Community shop",
    description:
      "Digital products and services help fund operations while keeping checkout simple for supporters.",
  },
];

export default async function AboutPage() {
  cacheLife("hours");
  cacheTag("squads", "players", "tournaments");

  const [[squadCount], [playerCount], [tournamentCount]] = await Promise.all([
    db
      .select({ value: count() })
      .from(squads)
      .where(eq(squads.archived, false)),
    db.select({ value: count() }).from(playerProfiles),
    db.select({ value: count() }).from(tournaments),
  ]);

  return (
    <PageSkeleton name="about" loading={false}>
      <main className="overflow-hidden">
        <section className="relative bg-linear-to-br from-primary/15 via-background to-background">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 desktop:grid-cols-[minmax(0,1fr)_30rem] desktop:items-center desktop:px-8 desktop:py-24">
            <div className="mx-auto max-w-lg text-center desktop:mx-0 desktop:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                About GASAK
              </p>
              <h1 className="mt-3 text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-6xl">
                More than a team,
                <span className="block text-primary">we are family.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-muted-foreground desktop:mx-0 desktop:text-base desktop:leading-8">
                GASAK ESPORT is built on passion, discipline, and brotherhood.
                We create champions both in-game and in life, with a mission to
                represent Malaysia on the biggest stage.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 desktop:justify-start">
                <LinkButton href="/recruitment" variant="solid" caret>
                  Join recruitment
                </LinkButton>
                <LinkButton href="/squads" caret>
                  View squads
                </LinkButton>
              </div>
            </div>

            <div aria-hidden="true" className="hidden min-h-80 desktop:block" />
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 desktop:px-8 desktop:py-14">
          <section className="grid overflow-hidden border border-primary/20 bg-card/60 desktop:grid-cols-4">
            <AboutStat
              label="Active squads"
              value={squadCount.value}
              icon={<Icons.Stats.Squads size={18} />}
            />
            <AboutStat
              label="Players"
              value={playerCount.value}
              icon={<Icons.Stats.Players size={18} />}
            />
            <AboutStat
              label="Tournaments"
              value={tournamentCount.value}
              icon={<Icons.Stats.Trophies size={18} />}
            />
            <AboutStat
              label="Mission"
              value="1"
              suffix="goal"
              icon={<Icons.Stats.Goal size={18} />}
            />
          </section>

          <section className="grid gap-8 desktop:grid-cols-[18rem_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Origin
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold uppercase tracking-wide desktop:text-4xl">
                From ranked stack to organization
              </h2>
            </div>
            <div className="grid gap-5 text-sm leading-7 text-muted-foreground desktop:grid-cols-2 desktop:text-base desktop:leading-8">
              <p>
                What started as a five-stack of friends queuing ranked has grown
                into a multi-squad organization built around structure, loyalty,
                and a shared competitive standard.
              </p>
              <p>
                We scout through open recruitment, develop players in the
                academy, and promote committed talent into competitive rosters
                that can carry the GASAK name with pride.
              </p>
            </div>
          </section>

          <section className="grid gap-4 desktop:grid-cols-3">
            {VALUES.map(({ Icon, title, body }) => (
              <BrandCard key={title} interactive={false} className="p-6">
                <Icon size={28} className="text-primary" />
                <h3 className="mt-5 font-heading text-2xl font-bold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
              </BrandCard>
            ))}
          </section>

          <section className="grid gap-8 border-y border-primary/20 py-10 desktop:grid-cols-[minmax(0,1fr)_24rem] desktop:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                How GASAK runs
              </p>
              <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold uppercase tracking-wide desktop:text-4xl">
                One system for squads, shop, and growth
              </h2>
              <div className="mt-8 grid gap-5">
                {PILLARS.map((pillar, index) => (
                  <div
                    key={pillar.title}
                    className="grid gap-3 border-t border-border pt-5 desktop:grid-cols-[3rem_1fr]"
                  >
                    <span className="font-mono text-sm text-primary">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-bold uppercase tracking-wide">
                        {pillar.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <BrandCard interactive={false} className="h-fit p-6">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wide">
                Ready to move with us?
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Follow the squads, apply through recruitment, or support the
                shop. Every part of the ecosystem helps the next tournament run.
              </p>
              <div className="mt-6 grid gap-3">
                <LinkButton href="/tournaments" className="w-full" caret>
                  Tournament history
                </LinkButton>
                <LinkButton href="/shop" className="w-full" caret>
                  GASAK shop
                </LinkButton>
              </div>
            </BrandCard>
          </section>
        </div>
      </main>
    </PageSkeleton>
  );
}

function AboutStat({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-primary/15 border-b p-5 desktop:border-r desktop:border-b-0 last:desktop:border-r-0">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center border border-primary/25 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-3xl font-bold leading-none">
            {value}
            {suffix ? (
              <span className="ml-1 text-sm uppercase text-primary">
                {suffix}
              </span>
            ) : (
              "+"
            )}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
