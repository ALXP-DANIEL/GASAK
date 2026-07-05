import { count, desc, eq, isNull } from "drizzle-orm";
import { AboutSection } from "@/components/old/home/about-section";
import { CtaBanner } from "@/components/old/home/cta-banner";
import { Hero } from "@/components/old/home/hero";
import { NewsSection } from "@/components/old/home/news-section";
import { ProductsSection } from "@/components/old/home/products-section";
import { SquadsSection } from "@/components/old/home/squads-section";
import { StatsBar } from "@/components/old/home/stats-bar";
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
  const [
    [squadCount],
    [playerCount],
    [tournamentCount],
    featuredSquads,
    news,
    topProducts,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(squads)
      .where(eq(squads.archived, false)),
    db.select({ value: count() }).from(playerProfiles),
    db.select({ value: count() }).from(tournaments),
    db
      .select()
      .from(squads)
      .where(eq(squads.archived, false))
      .orderBy(squads.createdAt)
      .limit(4),
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
      .limit(5),
  ]);

  return (
    <>
      <Hero />
      <StatsBar
        stats={{
          squads: squadCount.value,
          tournaments: tournamentCount.value,
          players: playerCount.value,
        }}
      />
      <SquadsSection squads={featuredSquads} />
      <AboutSection />
      <NewsSection items={news} />
      <ProductsSection products={topProducts} />
      <CtaBanner />
    </>
  );
}
