import { NewsCard } from "@components/cards";
import { LinkButton, PageHero } from "@components/ui/brand";
import { formatDateTime } from "@lib/format";
import { createPageMetadata } from "@lib/metadata";
import { db } from "@server/db";
import { eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getNews(newsId: string) {
  return db.query.announcements.findFirst({
    where: (announcement, { and }) =>
      and(eq(announcement.id, newsId), isNull(announcement.squadId)),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const { newsId } = await params;
  const item = await getNews(newsId);
  if (!item) return {};

  return createPageMetadata({
    title: item.title,
    description: item.content,
    path: `/news/${item.id}`,
    type: "News",
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const { newsId } = await params;
  const item = await getNews(newsId);
  if (!item) notFound();

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 desktop:grid-cols-[minmax(0,24rem)_1fr] desktop:px-8 desktop:py-14">
      <NewsCard item={item} variant="default" />

      <article className="flex flex-col justify-center gap-6">
        <PageHero
          align="left"
          eyebrow={formatDateTime(item.createdAt)}
          title={item.title}
          description={item.content}
        />
        <div>
          <LinkButton href="/news">Back to news</LinkButton>
        </div>
      </article>
    </main>
  );
}
