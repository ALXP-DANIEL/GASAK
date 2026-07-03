"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveUpload } from "@/lib/uploads";
import { actionUser, isSquadLeader } from "@/server/authz";
import { db, squadMembers, squadRoleEnum, squads } from "@/server/db";
import type { ActionResult } from "./public";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function revalidateSquads() {
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
});

export async function createSquad(formData: FormData): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const parsed = squadSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    accentColor: formData.get("accentColor") || undefined,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const slug = slugify(parsed.data.name);
  const existing = await db.query.squads.findFirst({
    where: eq(squads.slug, slug),
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

  await db.insert(squads).values({
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    accentColor: parsed.data.accentColor ?? null,
    logoUrl,
    bannerUrl,
  });

  revalidateSquads();
  return { ok: true, message: "Squad created" };
}

export async function updateSquad(
  squadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await actionUser("admin", "leader");
  if (!user) return { ok: false, error: "Unauthorized" };
  if (user.role !== "admin" && !(await isSquadLeader(user.id, squadId))) {
    return { ok: false, error: "You do not lead this squad" };
  }

  const parsed = squadSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    accentColor: formData.get("accentColor") || undefined,
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
  };

  if (parsed.data.name !== squad.name) {
    const slug = slugify(parsed.data.name);
    const clash = await db.query.squads.findFirst({
      where: and(eq(squads.slug, slug), ne(squads.id, squadId)),
    });
    if (clash) return { ok: false, error: "A squad with that name exists" };
    updates.slug = slug;
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

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${squadId}`);
  return { ok: true, message: "Squad updated" };
}

export async function setSquadArchived(
  squadId: string,
  archived: boolean,
): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  await db.update(squads).set({ archived }).where(eq(squads.id, squadId));

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
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const parsed = memberSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.query.squadMembers.findFirst({
    where: and(
      eq(squadMembers.squadId, parsed.data.squadId),
      eq(squadMembers.userId, parsed.data.userId),
    ),
  });
  if (existing) {
    return { ok: false, error: "That user is already in the squad" };
  }

  await db.insert(squadMembers).values(parsed.data);

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${parsed.data.squadId}`);
  return { ok: true, message: "Member assigned" };
}

export async function updateSquadMemberRole(
  memberId: string,
  squadRole: (typeof squadRoleEnum.enumValues)[number],
): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .update(squadMembers)
    .set({ squadRole })
    .where(eq(squadMembers.id, memberId))
    .returning();
  if (!row) return { ok: false, error: "Member not found" };

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${row.squadId}`);
  return { ok: true, message: "Role updated" };
}

export async function removeSquadMember(
  memberId: string,
): Promise<ActionResult> {
  const user = await actionUser("admin");
  if (!user) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(squadMembers)
    .where(eq(squadMembers.id, memberId))
    .returning();
  if (!row) return { ok: false, error: "Member not found" };

  revalidateSquads();
  revalidatePath(`/dashboard/squads/${row.squadId}`);
  return { ok: true, message: "Member removed" };
}
