"use server";

import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import {
  db,
  type OrderStatus,
  orders,
  productCategoryEnum,
  productGallery,
  productOptions,
  productOptionValues,
  products,
  productVariantOptionValues,
  productVariants,
} from "@server/db";
import { markOrderPaid } from "@server/order-payment";
import { deleteUpload, saveUpload } from "@server/uploads";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

function revalidateShop() {
  updateTag("products");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shop");
  revalidatePath("/");
}

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.enum(productCategoryEnum.enumValues),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: "Enter a valid price in RM",
    }),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, {
      message: "Enter a valid stock count",
    }),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
  });
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  let imageUrl: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await saveUpload(image, "products");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const [row] = await db
    .insert(products)
    .values({
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description ?? null,
      priceSen: Math.round(Number(parsed.data.price) * 100),
      stock: Number(parsed.data.stock),
      imageUrl,
      active: formData.get("active") === "on",
      createdBy: actor.id,
    })
    .returning();
  await logActivity({
    actor,
    action: "create",
    entityType: "product",
    entityId: row.id,
    description: `Created product "${row.name}"`,
  });

  revalidateShop();
  return { ok: true, message: "Product created", data: { productId: row.id } };
}

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const updates: Partial<typeof products.$inferInsert> = {
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description ?? null,
    priceSen: Math.round(Number(parsed.data.price) * 100),
    stock: Number(parsed.data.stock),
    active: formData.get("active") === "on",
  };

  const image = formData.get("image");
  let previousImageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const existing = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { imageUrl: true },
    });
    previousImageUrl = existing?.imageUrl ?? null;
    try {
      updates.imageUrl = await saveUpload(image, "products");
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const [row] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, productId))
    .returning();
  if (!row) return { ok: false, error: "Product not found" };
  if (updates.imageUrl && previousImageUrl !== updates.imageUrl) {
    await deleteUpload(previousImageUrl);
  }
  await logActivity({
    actor,
    action: "update",
    entityType: "product",
    entityId: row.id,
    description: `Updated product "${row.name}"`,
  });

  revalidateShop();
  return { ok: true, message: "Product updated" };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  // Capture hosted image URLs before the cascade delete wipes the rows.
  const existing = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      gallery: { columns: { imageUrl: true } },
      variants: { columns: { imageUrl: true } },
    },
  });

  let row: typeof products.$inferSelect | undefined;
  try {
    [row] = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning();
  } catch {
    return {
      ok: false,
      error: "This product has orders. Hide it from the shop instead.",
    };
  }
  if (!row) return { ok: false, error: "Product not found" };

  if (existing) {
    const urls = [
      existing.imageUrl,
      ...existing.gallery.map((g) => g.imageUrl),
      ...existing.variants.map((v) => v.imageUrl),
    ];
    for (const url of urls) await deleteUpload(url);
  }

  await logActivity({
    actor,
    action: "delete",
    entityType: "product",
    entityId: row.id,
    description: `Deleted product "${row.name}"`,
  });

  revalidateShop();
  return { ok: true, message: "Product deleted" };
}

// Order status transitions the seller can trigger from each state.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["waiting_payment", "cancelled"],
  waiting_payment: ["paid", "pending", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) return { ok: false, error: "Order not found" };

  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    return {
      ok: false,
      error: `Cannot move an order from "${order.status}" to "${status}"`,
    };
  }

  if (status === "paid") {
    await markOrderPaid(order, actor.id);
    await logActivity({
      actor,
      action: "update",
      entityType: "order",
      entityId: order.id,
      description: `Moved order ${order.orderNo} from ${order.status} to paid`,
    });
    revalidateShop();
    return { ok: true, message: `Order ${order.orderNo} → paid` };
  }

  // Cancelling a paid order returns the reserved stock. Joki orders never
  // deducted stock (zero-stock anchor product), so nothing to restore.
  if (
    status === "cancelled" &&
    !order.jokiDetails &&
    (order.status === "paid" || order.status === "processing")
  ) {
    if (order.variantId) {
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${order.quantity}` })
        .where(eq(productVariants.id, order.variantId));
    } else {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${order.quantity}` })
        .where(eq(products.id, order.productId));
    }
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  await logActivity({
    actor,
    action: "update",
    entityType: "order",
    entityId: order.id,
    description: `Moved order ${order.orderNo} from ${order.status} to ${status}`,
  });

  revalidateShop();
  return { ok: true, message: `Order ${order.orderNo} → ${status}` };
}

const variantOptionSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  values: z.array(z.string().min(1)).min(1, "Add at least one value"),
});

const variantInputSchema = z.object({
  optionValues: z.array(z.string()),
  priceSen: z.number().int().min(0),
  stock: z.number().int().min(0),
  imageUrl: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

const setProductVariantsSchema = z.object({
  options: z
    .array(variantOptionSchema)
    .max(2, "Up to 2 option types are supported"),
  variants: z.array(variantInputSchema),
});

/**
 * Replaces a product's whole variant matrix in one transaction — options,
 * their values, the variant rows, and the variant↔option-value links.
 * Simpler and safer than diffing an existing matrix against the new one.
 */
export async function setProductVariants(
  productId: string,
  input: z.infer<typeof setProductVariantsSchema>,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const parsed = setProductVariantsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });
  if (!product) return { ok: false, error: "Product not found" };

  const hasVariants =
    parsed.data.options.length > 0 && parsed.data.variants.length > 0;

  await db.transaction(async (tx) => {
    await tx
      .delete(productOptions)
      .where(eq(productOptions.productId, productId));
    await tx
      .delete(productVariants)
      .where(eq(productVariants.productId, productId));

    if (!hasVariants) {
      await tx
        .update(products)
        .set({ hasVariants: false })
        .where(eq(products.id, productId));
      return;
    }

    const valueIdByOption: Record<string, string>[] = [];
    for (let i = 0; i < parsed.data.options.length; i++) {
      const option = parsed.data.options[i];
      const [optionRow] = await tx
        .insert(productOptions)
        .values({ productId, name: option.name, sortOrder: i })
        .returning();

      valueIdByOption[i] = {};
      for (let j = 0; j < option.values.length; j++) {
        const [valueRow] = await tx
          .insert(productOptionValues)
          .values({
            optionId: optionRow.id,
            value: option.values[j],
            sortOrder: j,
          })
          .returning();
        valueIdByOption[i][option.values[j]] = valueRow.id;
      }
    }

    for (const variant of parsed.data.variants) {
      const [variantRow] = await tx
        .insert(productVariants)
        .values({
          productId,
          sku: variant.sku || null,
          priceSen: variant.priceSen,
          stock: variant.stock,
          imageUrl: variant.imageUrl || null,
          active: variant.active,
        })
        .returning();

      const optionValueIds = variant.optionValues.map(
        (value, i) => valueIdByOption[i]?.[value],
      );
      if (optionValueIds.some((id) => !id)) {
        throw new Error("Variant references an unknown option value");
      }

      await tx.insert(productVariantOptionValues).values(
        optionValueIds.map((optionValueId) => ({
          variantId: variantRow.id,
          optionValueId: optionValueId as string,
        })),
      );
    }

    await tx
      .update(products)
      .set({ hasVariants: true })
      .where(eq(products.id, productId));
  });

  await logActivity({
    actor,
    action: "update",
    entityType: "product",
    entityId: productId,
    description: `Updated variants for product "${product.name}"`,
  });

  revalidateShop();
  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/shop/${productId}`);
  return { ok: true, message: "Variants saved" };
}

export async function uploadVariantImage(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No image provided" };
  }

  try {
    const url = await saveUpload(file, "products");
    return { ok: true, data: { url } };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Saves up to 3 gallery images for a product. Each slot carries either a new
 * upload (`galleryImage_${i}`, mirrors the cover-image flow) or the URL of the
 * existing image to keep (`galleryKeep_${i}`); empty slots are dropped.
 */
export async function setProductGalleryFiles(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { gallery: { columns: { imageUrl: true } } },
  });
  if (!product) return { ok: false, error: "Product not found" };

  const imageUrls: string[] = [];
  for (let i = 0; i < 3; i++) {
    const file = formData.get(`galleryImage_${i}`);
    if (file instanceof File && file.size > 0) {
      try {
        imageUrls.push(await saveUpload(file, "products"));
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
      continue;
    }
    const keep = formData.get(`galleryKeep_${i}`);
    if (typeof keep === "string" && keep.length > 0) {
      imageUrls.push(keep);
    }
  }

  await db
    .delete(productGallery)
    .where(eq(productGallery.productId, productId));

  // Files whose rows were replaced/removed are no longer referenced.
  const kept = new Set(imageUrls);
  for (const old of product.gallery) {
    if (!kept.has(old.imageUrl)) await deleteUpload(old.imageUrl);
  }

  if (imageUrls.length > 0) {
    await db.insert(productGallery).values(
      imageUrls.map((imageUrl, index) => ({
        productId,
        imageUrl,
        sortOrder: index,
      })),
    );
  }

  await logActivity({
    actor,
    action: "update",
    entityType: "product",
    entityId: productId,
    description: `Updated gallery for product "${product.name}"`,
  });

  revalidateShop();
  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/shop/${productId}`);
  return { ok: true, message: "Gallery saved" };
}
