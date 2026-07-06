import { ContentCardGrid, NewsCard } from "@components/cards";
import { SectionHeader } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";
import { db, news } from "@server/db";
import { desc, isNull } from "drizzle-orm";
import { FeaturedNews } from "./_components/featured-news";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "News",
  description: "Latest news from GASAK Esport.",
  path: "/news",
  type: "News",
});

export default async function NewsPage() {
  const items = await db
    .select()
    .from(news)
    .where(isNull(news.squadId))
    .orderBy(desc(news.createdAt));

  const [featured, ...rest] = items;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 desktop:px-8 desktop:py-14">
      {!featured ? (
        <p className="text-center text-muted-foreground">
          No news yet — check back soon.
        </p>
      ) : (
        <>
          <FeaturedNews item={featured} />

          {rest.length > 0 && (
            <div className="flex flex-col gap-6">
              <SectionHeader
                align="left"
                eyebrow="More News"
                title="Every update from GASAK"
              />
              <ContentCardGrid>
                {rest.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    href={`/news/${item.id}`}
                  />
                ))}
              </ContentCardGrid>
            </div>
          )}
        </>
      )}
    </div>
  );
}
