import { Icons } from "@components/icons";
import { BrandFeatureCard, PageHero } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description: "The story and values of GASAK Esports.",
  path: "/about",
});

const VALUES = [
  {
    Icon: Icons.Stats.Goal,
    title: "Discipline",
    body: "Structured practice blocks, scrim reviews, and accountability for every player on the roster.",
  },
  {
    Icon: Icons.Domain.Community,
    title: "Grit",
    body: "We grind qualifiers and community cups relentlessly — losses become lessons, not excuses.",
  },
  {
    Icon: Icons.Stats.Squads,
    title: "Community",
    body: "From academy players to shop customers, GASAK is a family that grows Malaysian MLBB together.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="About GASAK"
        title="Built by players, for players"
        description="GASAK is a Malaysian Mobile Legends: Bang Bang organization with competitive squads, an academy pipeline, and a community shop that funds our tournament runs."
      />

      <section className="mx-auto grid max-w-4xl gap-4 text-center text-sm leading-relaxed text-muted-foreground desktop:grid-cols-2 desktop:text-left">
        <p>
          What started as a five-stack of friends queuing ranked has grown into
          a multi-squad organization built around discipline, passion, and
          brotherhood.
        </p>
        <p>
          Our goal is simple: put Malaysian talent on the biggest stages. We
          scout through open recruitment, develop players in the academy, and
          promote the best to the main squad.
        </p>
      </section>

      <section className="grid gap-4 desktop:grid-cols-3">
        {VALUES.map(({ Icon, title, body }) => (
          <BrandFeatureCard
            key={title}
            icon={<Icon size={28} />}
            title={title}
            description={body}
          />
        ))}
      </section>
    </div>
  );
}
