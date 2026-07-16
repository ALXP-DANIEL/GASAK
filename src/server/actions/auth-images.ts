"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { authImages, db } from "@server/db";
import { saveUpload } from "@server/uploads";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import type { ActionResult } from "./public";

function revalidateAuthImages() {
  revalidatePath("/dashboard/auth-images");
  updateTag("auth-images");
  revalidatePath("/login");
  revalidatePath("/forgot-password");
  revalidatePath("/reset-password");
}

export async function createAuthImage(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "Image is required" };
  }

  let imageUrl: string;
  try {
    imageUrl = await saveUpload(image, "auth-slides");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const [row] = await db
    .insert(authImages)
    .values({
      imageUrl,
      active: formData.get("active") === "on",
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Created auth image`,
  });

  revalidateAuthImages();
  return { ok: true, message: "Auth image created" };
}

export async function updateAuthImage(
  slideId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const updates: Partial<typeof authImages.$inferInsert> = {
    active: formData.get("active") === "on",
    updatedAt: new Date(),
  };

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      updates.imageUrl = await saveUpload(image, "auth-slides");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const [row] = await db
    .update(authImages)
    .set(updates)
    .where(eq(authImages.id, slideId))
    .returning();
  if (!row) return { ok: false, error: "Auth image not found" };
  await logActivity({
    actor,
    action: "update",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Updated auth image`,
  });

  revalidateAuthImages();
  return { ok: true, message: "Auth image updated" };
}

export async function deleteAuthImage(slideId: string): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(authImages)
    .where(eq(authImages.id, slideId))
    .returning();
  if (!row) return { ok: false, error: "Auth slide not found" };
  await logActivity({
    actor,
    action: "delete",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Deleted auth image`,
  });

  revalidateAuthImages();
  return { ok: true, message: "Auth slide deleted" };
}
