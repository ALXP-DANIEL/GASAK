import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Megaphone } from "@phosphor-icons/react/dist/ssr/Megaphone";
import { Storefront } from "@phosphor-icons/react/dist/ssr/Storefront";
import { Trophy } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UsersThree } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { count, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatDate, formatRM } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels";
import { createPageMetadata } from "@/lib/metadata";
import {
  announcements,
  db,
  playerProfiles,
  products,
  squads,
  tournaments,
} from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Home",
  description: "GASAK Esports — Malaysian MLBB organization.",
  path: "/",
  type: "Home",
});

export default async function HomePage() {
  const [[squadCount], [playerCount], [tournamentCount], news, featured] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(squads)
        .where(eq(squads.archived, false)),
      db.select({ value: count() }).from(playerProfiles),
      db.select({ value: count() }).from(tournaments),
      db
        .select()
        .from(announcements)
        .where(isNull(announcements.squadId))
        .orderBy(desc(announcements.createdAt))
        .limit(3),
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(products.priceSen)
        .limit(4),
    ]);

  const stats = [
    { label: "Active Squads", value: squadCount.value, Icon: UsersThree },
    { label: "Registered Players", value: playerCount.value, Icon: Lightning },
    { label: "Tournaments Played", value: tournamentCount.value, Icon: Trophy },
  ];

  return (
    <div className="flex flex-col gap-16">
      <section className="bg-grid relative flex flex-col items-center gap-6 pt-8 pb-6 text-center lg:pt-16">
        <Badge variant="outline" className="uppercase tracking-widest">
          Malaysian MLBB Esports Organization
        </Badge>
        <h1 className="max-w-3xl text-4xl font-black lg:text-6xl">
          We <span className="text-primary text-glow">GASAK</span> every lane,
          every objective, every game.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Competitive Mobile Legends squads, structured training, and a
          community shop — all under one roof.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow uppercase">
            <Link href="/recruitment">Join our roster</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="uppercase">
            <Link href="/shop">Visit the shop</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <Card key={label} className="corner-cut">
            <CardContent className="flex items-center gap-4 pt-6">
              <Icon size={28} className="text-primary" />
              <div>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {news.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Megaphone size={22} className="text-primary" />
            <h2 className="text-2xl font-bold">Latest news</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {news.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>
                    {formatDate(item.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Storefront size={22} className="text-primary" />
              <h2 className="text-2xl font-bold">From the shop</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/shop">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <Link key={product.id} href="/shop">
                <Card className="h-full hover-lift">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">
                      {PRODUCT_CATEGORY_LABELS[product.category]}
                    </Badge>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <CardDescription>
                      {formatRM(product.priceSen)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
