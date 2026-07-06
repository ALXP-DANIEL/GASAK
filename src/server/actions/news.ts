"use server";

import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad } from "@server/authz";
import { db, news, newsReads } from "@server/db";
import { userOrgRole } from "@server/session";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const newsSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(2, "Content is required"),
  squadId: z.uuid().nullable(),
});

export async function createNews(
  input: z.infer<typeof newsSchema>,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = newsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const role = userOrgRole(actor);
  if (role !== "admin") {
    // leaders can only post to squads they lead — never globally
    if (!parsed.data.squadId) {
      return { ok: false, error: "Only admins can post global news" };
    }
    if (!(await canManageSquad(actor.id, role, parsed.data.squadId))) {
      return { ok: false, error: "You do not lead this squad" };
    }
  }

  const [row] = await db
    .insert(news)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      squadId: parsed.data.squadId,
      authorId: actor.id,
    })
    .returning();

  await logActivity({
    actor,
    action: "create",
    entityType: "news",
    entityId: row.id,
    description: `Posted news "${row.title}"`,
  });

  revalidatePath("/dashboard/news");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, message: "News posted" };
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.news.findFirst({
    where: eq(news.id, id),
  });
  if (!row) return { ok: false, error: "News not found" };

  if (userOrgRole(actor) !== "admin" && row.authorId !== actor.id) {
    return { ok: false, error: "You can only delete your own news" };
  }

  await db.delete(news).where(eq(news.id, id));
  await logActivity({
    actor,
    action: "delete",
    entityType: "news",
    entityId: row.id,
    description: `Deleted news "${row.title}"`,
  });

  revalidatePath("/dashboard/news");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, message: "News deleted" };
}

export async function markNewsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const actor = await actionUser();
  if (!actor) return;

  await db
    .insert(newsReads)
    .values(ids.map((newsId) => ({ newsId, userId: actor.id })))
    .onConflictDoNothing();
}

export async function getUnreadNewsIds(
  userId: string,
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const readRows = await db
    .select({ newsId: newsReads.newsId })
    .from(newsReads)
    .where(and(eq(newsReads.userId, userId), inArray(newsReads.newsId, ids)));

  const readIds = new Set(readRows.map((r) => r.newsId));
  return new Set(ids.filter((id) => !readIds.has(id)));
}
