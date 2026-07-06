"use server";

import { saveUpload } from "@lib/uploads";
import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { authSlides, db } from "@server/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const slideSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(2, "Description is required"),
  eyebrow: z.string().min(2, "Eyebrow is required"),
  sortOrder: z
    .string()
    .min(1, "Sort order is required")
    .refine((value) => Number.isInteger(Number(value)), {
      message: "Sort order must be a whole number",
    }),
});

function parseSlideForm(formData: FormData) {
  return slideSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    eyebrow: formData.get("eyebrow"),
    sortOrder: formData.get("sortOrder"),
  });
}

function revalidateAuthSlides() {
  revalidatePath("/dashboard/auth-slides");
  revalidatePath("/login");
  revalidatePath("/forgot-password");
  revalidatePath("/reset-password");
}

export async function createAuthSlide(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseSlideForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

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
    .insert(authSlides)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      eyebrow: parsed.data.eyebrow,
      imageUrl,
      sortOrder: Number(parsed.data.sortOrder),
      active: formData.get("active") === "on",
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Created auth slide "${row.title}"`,
  });

  revalidateAuthSlides();
  return { ok: true, message: "Auth slide created" };
}

export async function updateAuthSlide(
  slideId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseSlideForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const updates: Partial<typeof authSlides.$inferInsert> = {
    title: parsed.data.title,
    description: parsed.data.description,
    eyebrow: parsed.data.eyebrow,
    sortOrder: Number(parsed.data.sortOrder),
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
    .update(authSlides)
    .set(updates)
    .where(eq(authSlides.id, slideId))
    .returning();
  if (!row) return { ok: false, error: "Auth slide not found" };
  await logActivity({
    actor,
    action: "update",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Updated auth slide "${row.title}"`,
  });

  revalidateAuthSlides();
  return { ok: true, message: "Auth slide updated" };
}

export async function deleteAuthSlide(slideId: string): Promise<ActionResult> {
  const actor = await actionUser("admin");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(authSlides)
    .where(eq(authSlides.id, slideId))
    .returning();
  if (!row) return { ok: false, error: "Auth slide not found" };
  await logActivity({
    actor,
    action: "delete",
    entityType: "auth_slide",
    entityId: row.id,
    description: `Deleted auth slide "${row.title}"`,
  });

  revalidateAuthSlides();
  return { ok: true, message: "Auth slide deleted" };
}
