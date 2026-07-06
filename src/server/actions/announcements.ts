"use server";

import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad } from "@server/authz";
import { announcementReads, announcements, db } from "@server/db";
import { userOrgRole } from "@server/session";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(2, "Content is required"),
  squadId: z.uuid().nullable(),
});

export async function createAnnouncement(
  input: z.infer<typeof announcementSchema>,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const role = userOrgRole(actor);
  if (role !== "admin") {
    // leaders can only post to squads they lead — never globally
    if (!parsed.data.squadId) {
      return { ok: false, error: "Only admins can post global announcements" };
    }
    if (!(await canManageSquad(actor.id, role, parsed.data.squadId))) {
      return { ok: false, error: "You do not lead this squad" };
    }
  }

  const [row] = await db
    .insert(announcements)
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
    entityType: "announcement",
    entityId: row.id,
    description: `Posted announcement "${row.title}"`,
  });

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, message: "Announcement posted" };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  const row = await db.query.announcements.findFirst({
    where: eq(announcements.id, id),
  });
  if (!row) return { ok: false, error: "Announcement not found" };

  if (userOrgRole(actor) !== "admin" && row.authorId !== actor.id) {
    return { ok: false, error: "You can only delete your own announcements" };
  }

  await db.delete(announcements).where(eq(announcements.id, id));
  await logActivity({
    actor,
    action: "delete",
    entityType: "announcement",
    entityId: row.id,
    description: `Deleted announcement "${row.title}"`,
  });

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, message: "Announcement deleted" };
}

export async function markAnnouncementsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const actor = await actionUser();
  if (!actor) return;

  await db
    .insert(announcementReads)
    .values(ids.map((announcementId) => ({ announcementId, userId: actor.id })))
    .onConflictDoNothing();
}

export async function getUnreadAnnouncementIds(
  userId: string,
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const readRows = await db
    .select({ announcementId: announcementReads.announcementId })
    .from(announcementReads)
    .where(
      and(
        eq(announcementReads.userId, userId),
        inArray(announcementReads.announcementId, ids),
      ),
    );

  const readIds = new Set(readRows.map((r) => r.announcementId));
  return new Set(ids.filter((id) => !readIds.has(id)));
}
