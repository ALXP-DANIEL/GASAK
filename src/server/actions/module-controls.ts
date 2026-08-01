"use server";

import {
  MODULE_CONTROL_KEYS,
  MODULE_CONTROLS,
  type ModuleControlKey,
} from "@lib/module-controls";
import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, moduleControls } from "@server/db";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import type { ActionResult } from "./public";

export async function getModuleControls(): Promise<
  Record<ModuleControlKey, boolean>
> {
  const rows = await db
    .select({
      moduleKey: moduleControls.moduleKey,
      enabled: moduleControls.enabled,
    })
    .from(moduleControls)
    .where(inArray(moduleControls.moduleKey, MODULE_CONTROL_KEYS));
  const stored = new Map(rows.map((row) => [row.moduleKey, row.enabled]));

  return Object.fromEntries(
    MODULE_CONTROL_KEYS.map((key) => [key, stored.get(key) ?? true]),
  ) as Record<ModuleControlKey, boolean>;
}

export async function isModuleEnabled(key: ModuleControlKey) {
  const row = await db.query.moduleControls.findFirst({
    where: eq(moduleControls.moduleKey, key),
  });
  return row?.enabled ?? true;
}

export async function setModuleEnabled(
  key: ModuleControlKey,
  enabled: boolean,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };
  if (!MODULE_CONTROL_KEYS.includes(key)) {
    return { ok: false, error: "Unknown module" };
  }

  await db
    .insert(moduleControls)
    .values({ moduleKey: key, enabled, updatedBy: actor.id })
    .onConflictDoUpdate({
      target: moduleControls.moduleKey,
      set: { enabled, updatedBy: actor.id, updatedAt: new Date() },
    });

  await logActivity({
    actor,
    action: "update",
    entityType: "module_control",
    entityId: key,
    description: `${enabled ? "Enabled" : "Disabled"} ${MODULE_CONTROLS[key].label}`,
  });

  revalidatePath("/dashboard/settings");
  updateTag("module-controls");
  return {
    ok: true,
    message: `${MODULE_CONTROLS[key].label} ${enabled ? "enabled" : "disabled"}`,
  };
}
