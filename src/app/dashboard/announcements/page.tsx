import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { EmptyState, PageHeader } from "@/components/dashboard/widgets";
import { requireRole, userRole } from "@/lib/session";
import {
  getUnreadAnnouncementIds,
  markAnnouncementsRead,
} from "@/server/actions/announcements";
import { getLedSquadIds, getMemberSquadIds } from "@/server/authz";
import { announcements, db, squads } from "@/server/db";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementFormDialog } from "./announcement-form";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const actor = await requireRole("admin", "leader", "member");
  const role = userRole(actor);

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
    if (role === "leader") {
      const ledIds = await getLedSquadIds(actor.id);
      postableSquads = ledIds.length
        ? await db
            .select({ id: squads.id, name: squads.name })
            .from(squads)
            .where(inArray(squads.id, ledIds))
            .orderBy(squads.name)
        : [];
    }
  }

  const canPost = role === "admin" || postableSquads.length > 0;

  const ids = rows.map((r) => r.id);
  const unreadIds = await getUnreadAnnouncementIds(actor.id, ids);
  await markAnnouncementsRead(ids);

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Global org news and squad-specific updates."
      >
        {canPost && (
          <AnnouncementFormDialog
            squads={postableSquads}
            allowGlobal={role === "admin"}
          />
        )}
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : (
        <div className="grid max-w-3xl gap-4">
          {rows.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              squadName={announcement.squad?.name ?? null}
              authorName={announcement.author?.name ?? "Unknown"}
              canDelete={role === "admin" || announcement.authorId === actor.id}
              isUnread={unreadIds.has(announcement.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function queryAll() {
  return db.query.announcements.findMany({
    orderBy: desc(announcements.createdAt),
    with: { squad: true, author: true },
  });
}
