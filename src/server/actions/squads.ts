"use server";

import { logActivity } from "@server/activity-log";
import { actionUser, canManageSquad, isSquadLeader } from "@server/authz";
import { db, squadMembers, squadRoleEnum, squads } from "@server/db";
import { userOrgRole } from "@server/session";
import { saveUpload } from "@server/uploads";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

function revalidateSquads() {
  updateTag("squads");
  revalidatePath("/dashboard/squads");
  revalidatePath("/dashboard/my-squad");
  revalidatePath("/squads");
  revalidatePath("/");
}

const squadSchema = z.object({
  name: z.string().min(2, "Squad name is required"),
  description: z.string().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a hex color")
    .optional(),
  recruiting: z.coerce.boolean().default(false),
});

export async function createSquad(formData: FormData): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const parsed = squadSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    accentColor: formData.get("accentColor") || undefined,
    recruiting: formData.get("recruiting") === "true",
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.query.squads.findFirst({
    where: eq(squads.name, parsed.data.name),
  });
  if (existing) return { ok: false, error: "A squad with that name exists" };

  let logoUrl: string | null = null;
  let bannerUrl: string | null = null;
  try {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) {
      logoUrl = await saveUpload(logo, "squads");
    }
    const banner = formData.get("banner");
    if (banner instanceof File && banner.size > 0) {
      bannerUrl = await saveUpload(banner, "squads");
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const [row] = await db
    .insert(squads)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      accentColor: parsed.data.accentColor ?? null,
      recruiting: parsed.data.recruiting,
      logoUrl,
      bannerUrl,
    })
    .returning();
  await logActivity({
    actor: user,
    action: "create",
    entityType: "squad",
    entityId: row.id,
    description: `Created squad "${row.name}"`,
  });

  revalidateSquads();
  return { ok: true, message: "Squad created" };
}

export async function updateSquad(
  squadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (user.role !== "admin" && !(await isSquadLeader(user.id, squadId))) {
    return { ok: false, error: "You do not lead this squad" };
  }

  const parsed = squadSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    accentColor: formData.get("accentColor") || undefined,
    recruiting: formData.get("recruiting") === "true",
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const squad = await db.query.squads.findFirst({
    where: eq(squads.id, squadId),
  });
  if (!squad) return { ok: false, error: "Squad not found" };

  const updates: Partial<typeof squads.$inferInsert> = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    accentColor: parsed.data.accentColor ?? null,
    recruiting: parsed.data.recruiting,
  };

  if (parsed.data.name !== squad.name) {
    const clash = await db.query.squads.findFirst({
      where: and(eq(squads.name, parsed.data.name), ne(squads.id, squadId)),
    });
    if (clash) return { ok: false, error: "A squad with that name exists" };
  }

  try {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) {
      updates.logoUrl = await saveUpload(logo, "squads");
    }
    const banner = formData.get("banner");
    if (banner instanceof File && banner.size > 0) {
      updates.bannerUrl = await saveUpload(banner, "squads");
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  await db.update(squads).set(updates).where(eq(squads.id, squadId));
  await logActivity({
    actor: user,
    action: "update",
    entityType: "squad",
    entityId: squad.id,
    description: `Updated squad "${parsed.data.name}"`,
  });

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${squadId}`);
  return { ok: true, message: "Squad updated" };
}

export async function deleteSquad(squadId: string): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(squads)
    .where(eq(squads.id, squadId))
    .returning();
  if (!row) return { ok: false, error: "Squad not found" };

  await logActivity({
    actor: user,
    action: "delete",
    entityType: "squad",
    entityId: row.id,
    description: `Deleted squad "${row.name}"`,
  });

  revalidateSquads();
  return { ok: true, message: "Squad deleted" };
}

export async function setSquadArchived(
  squadId: string,
  archived: boolean,
): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  await db.update(squads).set({ archived }).where(eq(squads.id, squadId));
  await logActivity({
    actor: user,
    action: archived ? "archive" : "restore",
    entityType: "squad",
    entityId: squadId,
    description: archived ? "Archived squad" : "Restored squad",
  });

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${squadId}`);
  return { ok: true, message: archived ? "Squad archived" : "Squad restored" };
}

const memberSchema = z.object({
  squadId: z.uuid(),
  userId: z.string().min(1, "Pick a user"),
  squadRole: z.enum(squadRoleEnum.enumValues),
});

export async function addSquadMember(
  input: z.infer<typeof memberSchema>,
): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const parsed = memberSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (
    !(await canManageSquad(user.id, userOrgRole(user), parsed.data.squadId))
  ) {
    return { ok: false, error: "You do not manage this squad" };
  }

  const existing = await db.query.squadMembers.findFirst({
    where: eq(squadMembers.userId, parsed.data.userId),
  });
  if (existing) {
    return {
      ok: false,
      error:
        existing.squadId === parsed.data.squadId
          ? "That user is already in the squad"
          : "That user is already in another squad",
    };
  }

  const [row] = await db.insert(squadMembers).values(parsed.data).returning();
  await logActivity({
    actor: user,
    action: "create",
    entityType: "squad_member",
    entityId: row.id,
    description: `Assigned user ${row.userId} to squad ${row.squadId} as ${row.squadRole}`,
  });

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${parsed.data.squadId}`);
  return { ok: true, message: "Member assigned" };
}

export async function updateSquadMemberRole(
  memberId: string,
  squadRole: (typeof squadRoleEnum.enumValues)[number],
): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const existing = await db.query.squadMembers.findFirst({
    where: eq(squadMembers.id, memberId),
  });
  if (!existing) return { ok: false, error: "Member not found" };
  if (!(await canManageSquad(user.id, userOrgRole(user), existing.squadId))) {
    return { ok: false, error: "You do not manage this squad" };
  }

  const [row] = await db
    .update(squadMembers)
    .set({ squadRole })
    .where(eq(squadMembers.id, memberId))
    .returning();
  if (!row) return { ok: false, error: "Member not found" };
  await logActivity({
    actor: user,
    action: "update",
    entityType: "squad_member",
    entityId: row.id,
    description: `Changed squad member ${row.userId} role to ${row.squadRole}`,
  });

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${row.squadId}`);
  return { ok: true, message: "Role updated" };
}

export async function removeSquadMember(
  memberId: string,
): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const existing = await db.query.squadMembers.findFirst({
    where: eq(squadMembers.id, memberId),
  });
  if (!existing) return { ok: false, error: "Member not found" };
  if (!(await canManageSquad(user.id, userOrgRole(user), existing.squadId))) {
    return { ok: false, error: "You do not manage this squad" };
  }

  const [row] = await db
    .delete(squadMembers)
    .where(eq(squadMembers.id, memberId))
    .returning();
  if (!row) return { ok: false, error: "Member not found" };
  await logActivity({
    actor: user,
    action: "delete",
    entityType: "squad_member",
    entityId: row.id,
    description: `Removed user ${row.userId} from squad ${row.squadId}`,
  });

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${row.squadId}`);
  return { ok: true, message: "Member removed" };
}
