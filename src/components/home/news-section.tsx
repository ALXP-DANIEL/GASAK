import { NewsCard } from "@/components/public/content-cards";
import { LinkButton, SectionHeader } from "@/components/ui/brand";
import type { Announcement } from "@/server/db/schema";

export function NewsSection({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;

  return (
    <section id="news" className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8">
      <SectionHeader eyebrow="Latest News" title="Stay updated" />

      <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <LinkButton href="/news" caret>
          View all news
        </LinkButton>
      </div>
    </section>
  );
}
