import { Crosshair } from "@phosphor-icons/react/dist/ssr/Crosshair";
import { HandFist } from "@phosphor-icons/react/dist/ssr/HandFist";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description: "The story and values of GASAK Esports.",
  path: "/about",
});

const VALUES = [
  {
    Icon: Crosshair,
    title: "Discipline",
    body: "Structured practice blocks, scrim reviews, and accountability for every player on the roster.",
  },
  {
    Icon: HandFist,
    title: "Grit",
    body: "We grind qualifiers and community cups relentlessly — losses become lessons, not excuses.",
  },
  {
    Icon: UsersThree,
    title: "Community",
    body: "From academy players to shop customers, GASAK is a family that grows Malaysian MLBB together.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">About GASAK</h1>
        <p className="max-w-2xl text-muted-foreground">
          GASAK is a Malaysian Mobile Legends: Bang Bang organization built by
          players, for players. What started as a five-stack of friends queuing
          ranked has grown into a multi-squad organization with a competitive
          main roster, an academy pipeline, and a community shop that funds our
          tournament runs.
        </p>
        <p className="max-w-2xl text-muted-foreground">
          Our goal is simple: put Malaysian talent on the biggest stages. We
          scout through open recruitment, develop players in the academy, and
          promote the best to the main squad.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {VALUES.map(({ Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon size={28} className="text-primary" />
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
