"use cache";

import { PageSkeleton } from "@components/shared/page-skeleton";
import { createPageMetadata } from "@lib/metadata";
import {
  db,
  news,
  playerProfiles,
  products,
  squads,
  tournaments,
} from "@server/db";
import { count, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { AboutSection } from "./_components/home/about-section";
import { CtaBanner } from "./_components/home/cta-banner";
import { Hero } from "./_components/home/hero";
import { NewsSection } from "./_components/home/news-section";
import { ProductsSection } from "./_components/home/products-section";
import { SquadsSection } from "./_components/home/squads-section";
import { StatsBar } from "./_components/home/stats-bar";

export const metadata = createPageMetadata({
  title: "Home",
  description: "GASAK Esports — Malaysian MLBB organization.",
  path: "/",
  type: "Home",
});

export default async function HomePage() {
  cacheLife("hours");
  cacheTag("squads", "players", "tournaments", "news", "products");

  const [
    [squadCount],
    [playerCount],
    [tournamentCount],
    featuredSquads,
    newsItems,
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
      .from(news)
      .where(isNull(news.squadId))
      .orderBy(desc(news.createdAt))
      .limit(3),
    db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(products.priceSen)
      .limit(5),
  ]);

  return (
    <PageSkeleton name="home" loading={false}>
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
        <NewsSection items={newsItems} />
        <ProductsSection products={topProducts} />
        <CtaBanner />
      </>
    </PageSkeleton>
  );
}
