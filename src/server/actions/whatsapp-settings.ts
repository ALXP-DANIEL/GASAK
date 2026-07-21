"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, whatsappSettings } from "@server/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const DEFAULT_ID = "default";

/** Admin-configurable WhatsApp recipient lists — a single settings row. */
export async function getWhatsappSettings() {
  return db.query.whatsappSettings.findFirst({
    where: eq(whatsappSettings.id, DEFAULT_ID),
  });
}

const settingsSchema = z.object({
  recruitmentRecipients: z.string().optional(),
  scheduleRecipients: z.string().optional(),
  birthdayRecipients: z.string().optional(),
});

export async function updateWhatsappSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const values = {
    recruitmentRecipients: parsed.data.recruitmentRecipients || null,
    scheduleRecipients: parsed.data.scheduleRecipients || null,
    birthdayRecipients: parsed.data.birthdayRecipients || null,
  };

  await db
    .insert(whatsappSettings)
    .values({ id: DEFAULT_ID, ...values })
    .onConflictDoUpdate({
      target: whatsappSettings.id,
      set: { ...values, updatedAt: new Date() },
    });

  await logActivity({
    actor,
    action: "update",
    entityType: "whatsapp_settings",
    entityId: DEFAULT_ID,
    description: "Updated WhatsApp recipient settings",
  });

  revalidatePath("/dashboard/integrations");
  return { ok: true, message: "WhatsApp settings saved" };
}
