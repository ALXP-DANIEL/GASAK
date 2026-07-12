"use server";

import { canonicalizeLanes } from "@lib/labels";
import { rankFieldSchema } from "@lib/ranks";
import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, laneEnum, playerProfiles, user } from "@server/db";
import { userOrgRole } from "@server/session";
import { saveUpload } from "@server/uploads";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const profileSchema = z.object({
  name: z.string().min(2, "Display name is required"),
  fullName: z.string().optional(),
  nickname: z.string().optional(),
  ign: z.string().optional(),
  mlbbId: z.string().optional(),
  serverId: z.string().optional(),
  phone: z.string().optional(),
  preferredLanes: z
    .array(z.enum(laneEnum.enumValues))
    .transform(canonicalizeLanes)
    .optional(),
  currentRank: rankFieldSchema.optional(),
  peakRank: rankFieldSchema.optional(),
});

export async function updateProfile(
  targetUserId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  // Members edit their own profile; admins can edit anyone.
  if (actor.id !== targetUserId && userOrgRole(actor) !== "admin") {
    return { ok: false, error: "You can only edit your own profile" };
  }

  const raw: Record<string, unknown> = Object.fromEntries(
    [
      "name",
      "fullName",
      "nickname",
      "ign",
      "mlbbId",
      "serverId",
      "phone",
      "currentRank",
      "peakRank",
    ].map((key) => {
      const value = formData.get(key);
      return [
        key,
        typeof value === "string" && value !== "" ? value : undefined,
      ];
    }),
  );

  // currentRank / peakRank are sent as JSON-encoded MlbbRank objects.
  for (const key of ["currentRank", "peakRank"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value !== "") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") raw[key] = parsed;
      } catch {
        // ignore malformed payloads; validation below will surface the issue
      }
    }
  }

  // preferredLanes is sent as a JSON-encoded array (multi-select field).
  const lanesRaw = formData.get("preferredLanes");
  let preferredLanes: unknown;
  if (typeof lanesRaw === "string" && lanesRaw !== "") {
    try {
      const parsedLanes = JSON.parse(lanesRaw);
      if (Array.isArray(parsedLanes)) preferredLanes = parsedLanes;
    } catch {
      // ignore malformed payloads; validation below will surface the issue
    }
  }

  const parsed = profileSchema.safeParse({ ...raw, preferredLanes });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const userUpdates: Partial<typeof user.$inferInsert> = {
    name: parsed.data.name,
  };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    try {
      userUpdates.image = await saveUpload(avatar, "avatars");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const { name: _name, ...profile } = parsed.data;
  await Promise.all([
    db.update(user).set(userUpdates).where(eq(user.id, targetUserId)),
    db
      .insert(playerProfiles)
      .values({ userId: targetUserId, ...profile })
      .onConflictDoUpdate({
        target: playerProfiles.userId,
        set: { ...profile, updatedAt: new Date() },
      }),
  ]);
  await logActivity({
    actor,
    action: "update",
    entityType: "profile",
    entityId: targetUserId,
    description:
      actor.id === targetUserId
        ? "Updated own player profile"
        : `Updated player profile for ${targetUserId}`,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/players");
  revalidatePath("/squads");
  updateTag("players");
  return { ok: true, message: "Profile saved" };
}
