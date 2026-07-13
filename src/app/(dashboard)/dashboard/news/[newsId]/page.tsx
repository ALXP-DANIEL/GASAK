import { Icons } from "@components/icons";
import { HtmlContent } from "@components/shared/html-content";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { Badge } from "@components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/shadcn/card";
import { formatDateTime } from "@lib/format";
import { getManagedSquadIds } from "@server/authz";
import { db, news, squads } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DetailRow, PageHeader } from "../../_components/page-surface";
import { NewsInlineEditor } from "../_components/news-inline-editor";

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

  const canManage = role === "admin" || item.authorId === actor.id;

  let postableSquads: { id: string; name: string }[] = [];
  if (canManage) {
    if (role === "admin") {
      postableSquads = await db
        .select({ id: squads.id, name: squads.name })
        .from(squads)
        .where(eq(squads.archived, false))
        .orderBy(squads.name);
    } else {
      const managedIds = await getManagedSquadIds(actor.id);
      postableSquads = managedIds.length
        ? await db
            .select({ id: squads.id, name: squads.name })
            .from(squads)
            .where(inArray(squads.id, managedIds))
            .orderBy(squads.name)
        : [];
    }
  }

  const detailsCard = (
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
        <DetailRow label="Author" value={item.author?.name ?? "Unknown"} />
        <DetailRow label="Created" value={formatDateTime(item.createdAt)} />
      </CardContent>
    </Card>
  );

  return (
    <PageSkeleton name="news-detail" loading={false}>
      <main>
        <PageHeader
          title={item.title}
          breadcrumbLabel={item.title}
          kicker="News"
          icon={Icons.Domain.News}
          description="Preview and manage this news post."
        />

        {canManage ? (
          <NewsInlineEditor
            news={item}
            squads={postableSquads}
            allowGlobal={role === "admin"}
          >
            {detailsCard}
          </NewsInlineEditor>
        ) : (
          <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Icons.Domain.News size={14} />
                  {formatDateTime(item.createdAt)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HtmlContent content={item.content} />
              </CardContent>
            </Card>

            <div className="grid h-fit gap-4">{detailsCard}</div>
          </div>
        )}
      </main>
    </PageSkeleton>
  );
}
