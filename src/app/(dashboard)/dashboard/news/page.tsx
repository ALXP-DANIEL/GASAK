import { Icons } from "@components/icons";
import { getUnreadNewsIds, markNewsRead } from "@server/actions/news";
import { getManagedSquadIds, getMemberSquadIds } from "@server/authz";
import { db, news, squads } from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { PageHeader } from "../_components/page-surface";
import { NewsFormDialog } from "./_components/news-form";
import { NewsList } from "./_components/news-list";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
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
    rows = await db.query.news.findMany({
      where: squadIds.length
        ? or(isNull(news.squadId), inArray(news.squadId, squadIds))
        : isNull(news.squadId),
      orderBy: desc(news.createdAt),
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
  const unreadIds = await getUnreadNewsIds(actor.id, ids);
  await markNewsRead(ids);

  const data = rows.map((row) => ({
    ...row,
    isUnread: unreadIds.has(row.id),
  }));

  const audienceFilterOptions = Array.from(
    new Set(data.map((row) => row.squad?.name ?? "Global")),
  ).map((value) => ({ value, label: value }));

  return (
    <main>
      <PageHeader
        title="News"
        kicker="Squad"
        icon={Icons.Domain.News}
        description="Global organization news and squad-specific updates."
      >
        {(role === "admin" || postableSquads.length > 0) && (
          <NewsFormDialog
            squads={postableSquads}
            allowGlobal={role === "admin"}
          />
        )}
      </PageHeader>
      <NewsList rows={data} audienceOptions={audienceFilterOptions} />
    </main>
  );
}

function queryAll() {
  return db.query.news.findMany({
    orderBy: desc(news.createdAt),
    with: { squad: true, author: true },
  });
}
