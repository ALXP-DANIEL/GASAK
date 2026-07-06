import { ContentCardGrid, NewsCard } from "@components/cards";
import { DeleteButton } from "@components/shared/delete-button";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { formatDateTime } from "@lib/format";
import { deleteNews } from "@server/actions/news";
import { db, news } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DetailRow, PageHeader } from "../../_components/page-surface";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const actor = await requireUser();
  const role = userOrgRole(actor);
  const { newsId } = await params;
  const item = await db.query.news.findFirst({
    where: eq(news.id, newsId),
    with: { squad: true, author: true },
  });
  if (!item) notFound();

  const canDelete = role === "admin" || item.authorId === actor.id;

  return (
    <main>
      <PageHeader
        title={item.title}
        description="Preview and manage this news post."
      />

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
        <ContentCardGrid>
          <NewsCard
            item={item}
            variant="default"
            meta={
              <p className="text-xs text-muted-foreground">
                {item.author?.name ?? "Unknown"} ·{" "}
                {formatDateTime(item.createdAt)}
              </p>
            }
          />
        </ContentCardGrid>

        <div className="grid h-fit gap-4">
          {canDelete && (
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Manage news post</CardTitle>
              </CardHeader>
              <CardContent>
                <DeleteButton
                  action={deleteNews.bind(null, item.id)}
                  title="Delete news post?"
                  description={`This will permanently remove "${item.title}".`}
                  redirectTo="/dashboard/news"
                />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>News details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailRow
                label="Scope"
                value={
                  <Badge variant={item.squad ? "outline" : "default"}>
                    {item.squad?.name ?? "Global"}
                  </Badge>
                }
              />
              <DetailRow
                label="Author"
                value={item.author?.name ?? "Unknown"}
              />
              <DetailRow
                label="Created"
                value={formatDateTime(item.createdAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
