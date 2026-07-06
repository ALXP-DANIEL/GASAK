"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userRole } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import { logActivity } from "@/server/activity-log";
import { actionUser } from "@/server/authz";
import { db, laneEnum, playerProfiles, user } from "@/server/db";
import type { ActionResult } from "./public";

const profileSchema = z.object({
  name: z.string().min(2, "Display name is required"),
  fullName: z.string().optional(),
  nickname: z.string().optional(),
  ign: z.string().optional(),
  mlbbId: z.string().optional(),
  serverId: z.string().optional(),
  phone: z.string().optional(),
  preferredLane: z.enum(laneEnum.enumValues).optional(),
  currentRank: z.string().optional(),
  peakRank: z.string().optional(),
});

export async function updateProfile(
  targetUserId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser();
  if (!actor) return { ok: false, error: "Unauthorized" };

  // Members edit their own profile; admins can edit anyone.
  if (actor.id !== targetUserId && userRole(actor) !== "admin") {
    return { ok: false, error: "You can only edit your own profile" };
  }

  const raw = Object.fromEntries(
    [
      "name",
      "fullName",
      "nickname",
      "ign",
      "mlbbId",
      "serverId",
      "phone",
      "preferredLane",
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

  const parsed = profileSchema.safeParse(raw);
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

  await db.update(user).set(userUpdates).where(eq(user.id, targetUserId));

  const { name: _name, ...profile } = parsed.data;
  await db
    .insert(playerProfiles)
    .values({ userId: targetUserId, ...profile })
    .onConflictDoUpdate({
      target: playerProfiles.userId,
      set: { ...profile, updatedAt: new Date() },
    });
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
  return { ok: true, message: "Profile saved" };
}
