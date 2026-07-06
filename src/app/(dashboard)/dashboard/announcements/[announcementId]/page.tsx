import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ContentCardGrid } from "@/components/cards";
import { NewsCard } from "@/components/news/news-card";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { formatDateTime } from "@/lib/format";
import { requireUser, userOrgRole } from "@/lib/session";
import { deleteAnnouncement } from "@/server/actions/announcements";
import { announcements, db } from "@/server/db";
import { DetailRow, PageHeader } from "../../_components/page-surface";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const actor = await requireUser();
  const role = userOrgRole(actor);
  const { announcementId } = await params;
  const announcement = await db.query.announcements.findFirst({
    where: eq(announcements.id, announcementId),
    with: { squad: true, author: true },
  });
  if (!announcement) notFound();

  const canDelete = role === "admin" || announcement.authorId === actor.id;

  return (
    <main>
      <PageHeader
        title={announcement.title}
        description="Preview and manage this announcement."
      />

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_24rem]">
        <ContentCardGrid>
          <NewsCard
            item={announcement}
            variant="default"
            meta={
              <p className="text-xs text-muted-foreground">
                {announcement.author?.name ?? "Unknown"} ·{" "}
                {formatDateTime(announcement.createdAt)}
              </p>
            }
          />
        </ContentCardGrid>

        <div className="grid h-fit gap-4">
          {canDelete && (
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle>Manage announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <DeleteButton
                  action={deleteAnnouncement.bind(null, announcement.id)}
                  title="Delete announcement?"
                  description={`This will permanently remove "${announcement.title}".`}
                  redirectTo="/dashboard/announcements"
                />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>Announcement details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailRow
                label="Scope"
                value={
                  <Badge variant={announcement.squad ? "outline" : "default"}>
                    {announcement.squad?.name ?? "Global"}
                  </Badge>
                }
              />
              <DetailRow
                label="Author"
                value={announcement.author?.name ?? "Unknown"}
              />
              <DetailRow
                label="Created"
                value={formatDateTime(announcement.createdAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
