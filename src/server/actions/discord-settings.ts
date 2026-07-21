"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, discordSettings } from "@server/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const DEFAULT_ID = "default";

/** Admin-configurable Discord channel IDs — a single settings row. */
export async function getDiscordSettings() {
  return db.query.discordSettings.findFirst({
    where: eq(discordSettings.id, DEFAULT_ID),
  });
}

const settingsSchema = z.object({
  recruitmentChannelId: z.string().optional(),
  scheduleChannelId: z.string().optional(),
  birthdayChannelId: z.string().optional(),
});

export async function updateDiscordSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const values = {
    recruitmentChannelId: parsed.data.recruitmentChannelId || null,
    scheduleChannelId: parsed.data.scheduleChannelId || null,
    birthdayChannelId: parsed.data.birthdayChannelId || null,
  };

  await db
    .insert(discordSettings)
    .values({ id: DEFAULT_ID, ...values })
    .onConflictDoUpdate({
      target: discordSettings.id,
      set: { ...values, updatedAt: new Date() },
    });

  await logActivity({
    actor,
    action: "update",
    entityType: "discord_settings",
    entityId: DEFAULT_ID,
    description: "Updated Discord channel settings",
  });

  revalidatePath("/dashboard/integrations");
  return { ok: true, message: "Discord settings saved" };
}
