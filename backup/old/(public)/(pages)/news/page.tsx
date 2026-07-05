import { desc, isNull } from "drizzle-orm";
import { NewsCard } from "@/components/old/public/content-cards";
import { PageHero } from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";
import { announcements, db } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "News",
  description: "Latest news and announcements from GASAK Esport.",
  path: "/old/news",
  type: "News",
});

export default async function NewsPage() {
  const items = await db
    .select()
    .from(announcements)
    .where(isNull(announcements.squadId))
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="flex flex-col items-center gap-10">
      <PageHero
        eyebrow="Latest News"
        title="Stay updated"
        description="Announcements, match notes, roster updates, and community news from GASAK."
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground">No news yet — check back soon.</p>
      ) : (
        <div className="grid w-full auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} mode="full" />
          ))}
        </div>
      )}
    </div>
  );
}
