import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { ContentCardGrid } from "@/components/cards";
import { requireUser, userOrgRole } from "@/lib/session";
import {
  getUnreadAnnouncementIds,
  markAnnouncementsRead,
} from "@/server/actions/announcements";
import { getManagedSquadIds, getMemberSquadIds } from "@/server/authz";
import { announcements, db, squads } from "@/server/db";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { AnnouncementCard } from "./_components/announcement-card";
import { AnnouncementFormDialog } from "./_components/announcement-form";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const actor = await requireUser();
  const role = userOrgRole(actor);

  let rows: Awaited<ReturnType<typeof queryAll>>;
  let postableSquads: { id: string; name: string }[] = [];

  if (role === "admin") {
    rows = await queryAll();
    postableSquads = await db
      .select({ id: squads.id, name: squads.name })
      .from(squads)
      .where(eq(squads.archived, false))
      .orderBy(squads.name);
  } else {
    const squadIds = await getMemberSquadIds(actor.id);
    rows = await db.query.announcements.findMany({
      where: squadIds.length
        ? or(
            isNull(announcements.squadId),
            inArray(announcements.squadId, squadIds),
          )
        : isNull(announcements.squadId),
      orderBy: desc(announcements.createdAt),
      with: { squad: true, author: true },
    });

    const managedIds = await getManagedSquadIds(actor.id);
    postableSquads = managedIds.length
      ? await db
          .select({ id: squads.id, name: squads.name })
          .from(squads)
          .where(inArray(squads.id, managedIds))
          .orderBy(squads.name)
      : [];
  }

  const ids = rows.map((row) => row.id);
  const unreadIds = await getUnreadAnnouncementIds(actor.id, ids);
  await markAnnouncementsRead(ids);

  return (
    <main>
      <PageHeader
        title="Announcements"
        description="Global organization news and squad-specific updates."
      >
        {(role === "admin" || postableSquads.length > 0) && (
          <AnnouncementFormDialog
            squads={postableSquads}
            allowGlobal={role === "admin"}
          />
        )}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : (
        <ContentCardGrid>
          {rows.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              squadName={announcement.squad?.name ?? null}
              authorName={announcement.author?.name ?? "Unknown"}
              isUnread={unreadIds.has(announcement.id)}
            />
          ))}
        </ContentCardGrid>
      )}
    </main>
  );
}

function queryAll() {
  return db.query.announcements.findMany({
    orderBy: desc(announcements.createdAt),
    with: { squad: true, author: true },
  });
}
