import { ContentCardGrid, NewsCard } from "@components/cards";
import { PageHero } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";
import { announcements, db } from "@server/db";
import { desc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "News",
  description: "Latest news and announcements from GASAK Esport.",
  path: "/news",
  type: "News",
});

export default async function NewsPage() {
  const items = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.squadId))
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Latest News"
        title="Stay updated"
        description="Announcements, match notes, roster updates, and community news from GASAK."
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground">No news yet — check back soon.</p>
      ) : (
        <ContentCardGrid className="w-full">
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              variant="default"
              href={`/news/${item.id}`}
            />
          ))}
        </ContentCardGrid>
      )}
    </div>
  );
}
