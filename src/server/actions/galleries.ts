"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, galleries } from "@server/db";
import { saveUpload } from "@server/uploads";
import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const gallerySchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().default(""),
  sortOrder: z
    .string()
    .min(1, "Sort order is required")
    .refine((value) => Number.isInteger(Number(value)), {
      message: "Sort order must be a whole number",
    }),
});

function parseGalleryForm(formData: FormData) {
  return gallerySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder"),
  });
}

function revalidateGalleries() {
  revalidatePath("/dashboard/galleries");
  updateTag("galleries");
  revalidatePath("/gallery");
}

export async function createGalleryImage(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseGalleryForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "Image is required" };
  }

  let imageUrl: string;
  try {
    imageUrl = await saveUpload(image, "galleries");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const [row] = await db
    .insert(galleries)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl,
      sortOrder: Number(parsed.data.sortOrder),
      active: formData.get("active") === "on",
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "gallery",
    entityId: row.id,
    description: `Created gallery image "${row.title}"`,
  });

  revalidateGalleries();
  return { ok: true, message: "Gallery image created" };
}

export async function updateGalleryImage(
  imageId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseGalleryForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const updates: Partial<typeof galleries.$inferInsert> = {
    title: parsed.data.title,
    description: parsed.data.description,
    sortOrder: Number(parsed.data.sortOrder),
    active: formData.get("active") === "on",
    updatedAt: new Date(),
  };

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      updates.imageUrl = await saveUpload(image, "galleries");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const [row] = await db
    .update(galleries)
    .set(updates)
    .where(eq(galleries.id, imageId))
    .returning();
  if (!row) return { ok: false, error: "Gallery image not found" };
  await logActivity({
    actor,
    action: "update",
    entityType: "gallery",
    entityId: row.id,
    description: `Updated gallery image "${row.title}"`,
  });

  revalidateGalleries();
  return { ok: true, message: "Gallery image updated" };
}

export async function deleteGalleryImage(
  imageId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(galleries)
    .where(eq(galleries.id, imageId))
    .returning();
  if (!row) return { ok: false, error: "Gallery image not found" };
  await logActivity({
    actor,
    action: "delete",
    entityType: "gallery",
    entityId: row.id,
    description: `Deleted gallery image "${row.title}"`,
  });

  revalidateGalleries();
  return { ok: true, message: "Gallery image deleted" };
}
