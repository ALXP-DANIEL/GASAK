"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, organizationPositions } from "@server/db";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

function revalidateOrganization() {
  revalidatePath("/dashboard/organization");
  revalidatePath("/organization");
}

const positionSchema = z.object({
  title: z.string().min(2, "Title is required"),
  icon: z.string().optional(),
  sortOrder: z
    .string()
    .min(1, "Sort order is required")
    .refine((value) => Number.isInteger(Number(value)), {
      message: "Sort order must be a whole number",
    }),
  userId: z.string().optional(),
  parentId: z.string().optional(),
});

function parsePositionForm(formData: FormData) {
  return positionSchema.safeParse({
    title: formData.get("title"),
    icon: formData.get("icon") || undefined,
    sortOrder: formData.get("sortOrder"),
    userId: formData.get("userId") || undefined,
    parentId: formData.get("parentId") || undefined,
  });
}

async function assertUserAvailable(userId: string, excludePositionId?: string) {
  const existing = await db.query.organizationPositions.findFirst({
    where: excludePositionId
      ? and(
          eq(organizationPositions.userId, userId),
          ne(organizationPositions.id, excludePositionId),
        )
      : eq(organizationPositions.userId, userId),
  });
  return !existing;
}

async function assertParentExists(parentId: string) {
  const parent = await db.query.organizationPositions.findFirst({
    where: eq(organizationPositions.id, parentId),
    columns: { id: true },
  });
  return Boolean(parent);
}

async function assertNoCycle(positionId: string, parentId: string) {
  let current: string | null = parentId;
  while (current) {
    if (current === positionId) return false;
    const row: { parentId: string | null } | undefined =
      await db.query.organizationPositions.findFirst({
        where: eq(organizationPositions.id, current),
        columns: { parentId: true },
      });
    current = row?.parentId ?? null;
  }
  return true;
}

export async function createOrganizationPosition(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parsePositionForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    parsed.data.userId &&
    !(await assertUserAvailable(parsed.data.userId))
  ) {
    return { ok: false, error: "That user already holds a position" };
  }

  if (parsed.data.parentId && !(await assertParentExists(parsed.data.parentId))) {
    return { ok: false, error: "Selected parent position no longer exists" };
  }

  const [row] = await db
    .insert(organizationPositions)
    .values({
      title: parsed.data.title,
      icon: parsed.data.icon ?? null,
      sortOrder: Number(parsed.data.sortOrder),
      userId: parsed.data.userId || null,
      parentId: parsed.data.parentId || null,
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "organization_position",
    entityId: row.id,
    description: `Created organization position "${row.title}"`,
  });

  revalidateOrganization();
  return { ok: true, message: "Position created" };
}

export async function updateOrganizationPosition(
  positionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parsePositionForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    parsed.data.userId &&
    !(await assertUserAvailable(parsed.data.userId, positionId))
  ) {
    return { ok: false, error: "That user already holds a position" };
  }

  if (parsed.data.parentId) {
    if (parsed.data.parentId === positionId) {
      return { ok: false, error: "A position cannot report to itself" };
    }
    if (!(await assertParentExists(parsed.data.parentId))) {
      return { ok: false, error: "Selected parent position no longer exists" };
    }
    if (!(await assertNoCycle(positionId, parsed.data.parentId))) {
      return { ok: false, error: "That would create a circular hierarchy" };
    }
  }

  const [row] = await db
    .update(organizationPositions)
    .set({
      title: parsed.data.title,
      icon: parsed.data.icon ?? null,
      sortOrder: Number(parsed.data.sortOrder),
      userId: parsed.data.userId || null,
      parentId: parsed.data.parentId || null,
      updatedAt: new Date(),
    })
    .where(eq(organizationPositions.id, positionId))
    .returning();
  if (!row) return { ok: false, error: "Position not found" };
  await logActivity({
    actor,
    action: "update",
    entityType: "organization_position",
    entityId: row.id,
    description: `Updated organization position "${row.title}"`,
  });

  revalidateOrganization();
  return { ok: true, message: "Position updated" };
}

export async function deleteOrganizationPosition(
  positionId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(organizationPositions)
    .where(eq(organizationPositions.id, positionId))
    .returning();
  if (!row) return { ok: false, error: "Position not found" };
  await logActivity({
    actor,
    action: "delete",
    entityType: "organization_position",
    entityId: row.id,
    description: `Deleted organization position "${row.title}"`,
  });

  revalidateOrganization();
  return { ok: true, message: "Position deleted" };
}
