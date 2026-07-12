"use cache";

import { NewsCard } from "@components/cards";
import { Icons } from "@components/icons";
import { HtmlContent } from "@components/shared/html-content";
import { LinkButton } from "@components/ui/brand";
import { formatDate, stripHtml } from "@lib/format";
import { createPageMetadata } from "@lib/metadata";
import { db } from "@server/db";
import { desc, eq, isNull, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

async function getNews(newsId: string) {
  return db.query.news.findFirst({
    where: (news, { and }) => and(eq(news.id, newsId), isNull(news.squadId)),
  });
}

function getMoreNews(excludeId: string) {
  return db.query.news.findMany({
    where: (news, { and }) => and(isNull(news.squadId), ne(news.id, excludeId)),
    orderBy: (news) => desc(news.createdAt),
    limit: 3,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  cacheLife("hours");
  cacheTag("news");

  const { newsId } = await params;
  const item = await getNews(newsId);
  if (!item) return {};

  return createPageMetadata({
    title: item.title,
    description: stripHtml(item.content).slice(0, 160),
    path: `/news/${item.id}`,
    type: "News",
    meta: formatDate(item.createdAt),
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  cacheLife("hours");
  cacheTag("news");

  const { newsId } = await params;
  const item = await getNews(newsId);
  if (!item) notFound();

  const moreNews = await getMoreNews(item.id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <LinkButton href="/news" variant="outline" size="sm" className="w-fit">
        ← Back to news
      </LinkButton>

      <article className="flex max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
            <Icons.Domain.News size={13} aria-hidden />
            News
          </span>
          <time
            dateTime={new Date(item.createdAt).toISOString()}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
          >
            {formatDate(item.createdAt)}
          </time>
        </div>

        <div className="min-w-0">
          <h1 className="max-w-4xl text-balance font-heading text-4xl font-bold uppercase leading-tight tracking-wide desktop:text-5xl">
            {item.title}
          </h1>

          <HtmlContent
            content={item.content}
            className="mt-8 max-w-3xl prose-base desktop:prose-lg"
          />
        </div>
      </article>

      {moreNews.length > 0 && (
        <div className="flex flex-col gap-6 border-t border-primary/15 pt-10">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
            More News
          </h2>
          <div className="grid gap-4 desktop:grid-cols-3">
            {moreNews.map((related) => (
              <NewsCard
                key={related.id}
                item={related}
                href={`/news/${related.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
