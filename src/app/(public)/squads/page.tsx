import { count, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { createPageMetadata } from "@/lib/metadata";
import { db, squadMembers, squads } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Squads",
  description: "The competitive squads of GASAK Esports.",
  path: "/squads",
});

export default async function SquadsPage() {
  const rows = await db
    .select({
      squad: squads,
      memberCount: count(squadMembers.id),
    })
    .from(squads)
    .leftJoin(squadMembers, eq(squadMembers.squadId, squads.id))
    .where(eq(squads.archived, false))
    .groupBy(squads.id)
    .orderBy(squads.createdAt);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Our Squads</h1>
        <p className="mt-2 text-muted-foreground">
          The rosters representing GASAK in tournaments and scrims.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rows.map(({ squad, memberCount }) => (
          <Link key={squad.id} href={`/squads/${squad.slug}`}>
            <Card className="h-full overflow-hidden hover-lift">
              {squad.bannerUrl && (
                <div className="relative h-32 w-full">
                  <Image
                    src={squad.bannerUrl}
                    alt={`${squad.name} banner`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  {squad.logoUrl && (
                    <Image
                      src={squad.logoUrl}
                      alt={`${squad.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  )}
                  <div>
                    <CardTitle>{squad.name}</CardTitle>
                    <CardDescription>
                      {memberCount} player{memberCount === 1 ? "" : "s"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {squad.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            No squads yet — check back soon.
          </p>
        )}
      </div>
      <Badge variant="secondary" className="w-fit">
        Want in? Apply through the recruitment page.
      </Badge>
    </div>
  );
}
