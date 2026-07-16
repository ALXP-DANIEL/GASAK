"use server";

import { RANK_TIERS } from "@lib/ranks";
import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import { db, jokiPackages, jokiServiceImages, jokiTiers } from "@server/db";
import { saveUpload } from "@server/uploads";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

function revalidateJoki() {
  updateTag("joki");
  revalidatePath("/dashboard/products/joki");
  revalidatePath("/shop/joki/per-star");
  revalidatePath("/shop/joki/package");
  revalidatePath("/shop");
}

const tierSchema = z.object({
  name: z.enum(RANK_TIERS, "Pick a rank tier"),
  pricePerStar: z.number("Enter a price").positive("Enter a valid price in RM"),
  active: z.boolean(),
});

export type TierInput = z.infer<typeof tierSchema>;

export async function createJokiTier(input: TierInput): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await db.query.jokiTiers.findFirst({
    where: eq(jokiTiers.name, parsed.data.name),
  });
  if (existing) {
    return { ok: false, error: `"${parsed.data.name}" is already configured` };
  }

  const [row] = await db
    .insert(jokiTiers)
    .values({
      name: parsed.data.name,
      pricePerStarSen: Math.round(parsed.data.pricePerStar * 100),
      active: parsed.data.active,
    })
    .returning();

  await logActivity({
    actor,
    action: "create",
    entityType: "joki_tier",
    entityId: row.id,
    description: `Created joki tier "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Tier created" };
}

export async function updateJokiTier(
  tierId: string,
  input: TierInput,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await db.query.jokiTiers.findFirst({
    where: eq(jokiTiers.name, parsed.data.name),
  });
  if (existing && existing.id !== tierId) {
    return { ok: false, error: `"${parsed.data.name}" is already configured` };
  }

  const [row] = await db
    .update(jokiTiers)
    .set({
      name: parsed.data.name,
      pricePerStarSen: Math.round(parsed.data.pricePerStar * 100),
      active: parsed.data.active,
    })
    .where(eq(jokiTiers.id, tierId))
    .returning();
  if (!row) return { ok: false, error: "Tier not found" };

  await logActivity({
    actor,
    action: "update",
    entityType: "joki_tier",
    entityId: row.id,
    description: `Updated joki tier "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Tier updated" };
}

export async function deleteJokiTier(tierId: string): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  // fromTierId/toTierId cascade on delete — block explicitly instead of
  // silently wiping any package that references this tier.
  const referencing = await db.query.jokiPackages.findFirst({
    where: or(
      eq(jokiPackages.fromTierId, tierId),
      eq(jokiPackages.toTierId, tierId),
    ),
  });
  if (referencing) {
    return {
      ok: false,
      error: `This tier is used by package "${referencing.name}". Remove or repoint it first.`,
    };
  }

  const [row] = await db
    .delete(jokiTiers)
    .where(eq(jokiTiers.id, tierId))
    .returning();
  if (!row) return { ok: false, error: "Tier not found" };

  await logActivity({
    actor,
    action: "delete",
    entityType: "joki_tier",
    entityId: row.id,
    description: `Deleted joki tier "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Tier deleted" };
}

const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  fromTierId: z.uuid("Pick the starting tier"),
  toTierId: z.uuid("Pick the target tier"),
  price: z.number("Enter a price").positive("Enter a valid price in RM"),
  active: z.boolean(),
});

export type PackageInput = z.infer<typeof packageSchema>;

export async function createJokiPackage(
  input: PackageInput,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await db.query.jokiPackages.findFirst({
    where: and(
      eq(jokiPackages.fromTierId, parsed.data.fromTierId),
      eq(jokiPackages.toTierId, parsed.data.toTierId),
    ),
  });
  if (existing) {
    return {
      ok: false,
      error: `A package for that range already exists: "${existing.name}"`,
    };
  }

  const [row] = await db
    .insert(jokiPackages)
    .values({
      name: parsed.data.name,
      fromTierId: parsed.data.fromTierId,
      toTierId: parsed.data.toTierId,
      priceSen: Math.round(parsed.data.price * 100),
      active: parsed.data.active,
    })
    .returning();

  await logActivity({
    actor,
    action: "create",
    entityType: "joki_package",
    entityId: row.id,
    description: `Created joki package "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Package created" };
}

export async function updateJokiPackage(
  packageId: string,
  input: PackageInput,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await db.query.jokiPackages.findFirst({
    where: and(
      eq(jokiPackages.fromTierId, parsed.data.fromTierId),
      eq(jokiPackages.toTierId, parsed.data.toTierId),
    ),
  });
  if (existing && existing.id !== packageId) {
    return {
      ok: false,
      error: `A package for that range already exists: "${existing.name}"`,
    };
  }

  const [row] = await db
    .update(jokiPackages)
    .set({
      name: parsed.data.name,
      fromTierId: parsed.data.fromTierId,
      toTierId: parsed.data.toTierId,
      priceSen: Math.round(parsed.data.price * 100),
      active: parsed.data.active,
    })
    .where(eq(jokiPackages.id, packageId))
    .returning();
  if (!row) return { ok: false, error: "Package not found" };

  await logActivity({
    actor,
    action: "update",
    entityType: "joki_package",
    entityId: row.id,
    description: `Updated joki package "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Package updated" };
}

export async function deleteJokiPackage(
  packageId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(jokiPackages)
    .where(eq(jokiPackages.id, packageId))
    .returning();
  if (!row) return { ok: false, error: "Package not found" };

  await logActivity({
    actor,
    action: "delete",
    entityType: "joki_package",
    entityId: row.id,
    description: `Deleted joki package "${row.name}"`,
  });

  revalidateJoki();
  return { ok: true, message: "Package deleted" };
}

export async function updateJokiServiceImage(
  mode: "per_star" | "package",
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "Choose an image to upload" };
  }

  let imageUrl: string;
  try {
    imageUrl = await saveUpload(image, "joki");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  await db
    .insert(jokiServiceImages)
    .values({ mode, imageUrl })
    .onConflictDoUpdate({
      target: jokiServiceImages.mode,
      set: { imageUrl },
    });

  await logActivity({
    actor,
    action: "update",
    entityType: "joki_service_image",
    entityId: mode,
    description: `Updated joki ${mode === "per_star" ? "per-star" : "package"} page image`,
  });

  revalidateJoki();
  return { ok: true, message: "Image updated" };
}
