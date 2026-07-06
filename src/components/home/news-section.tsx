import { ContentCardGrid } from "@components/cards";
import { NewsCard } from "@components/news/news-card";
import { LinkButton, SectionHeader } from "@components/ui/brand";
import type { Announcement } from "@server/db/schema";

export function NewsSection({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;

  return (
    <section
      id="news"
      className="mx-auto w-full max-w-7xl px-4 py-14 desktop:px-8"
    >
      <SectionHeader eyebrow="Latest News" title="Stay updated" />

      <ContentCardGrid className="mt-10">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} href={`/news/${item.id}`} />
        ))}
      </ContentCardGrid>

      <div className="mt-8 flex justify-center">
        <LinkButton href="/news" caret>
          View all news
        </LinkButton>
      </div>
    </section>
  );
}
