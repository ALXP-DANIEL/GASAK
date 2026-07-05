"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveUpload } from "@/lib/uploads";
import { actionUser } from "@/server/authz";
import {
  db,
  type OrderStatus,
  orders,
  productCategoryEnum,
  products,
} from "@/server/db";
import type { ActionResult } from "./public";

function revalidateShop() {
  revalidatePath("/old/dashboard/products");
  revalidatePath("/old/dashboard/orders");
  revalidatePath("/old/dashboard");
  revalidatePath("/old/shop");
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

  await db.insert(products).values({
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description ?? null,
    priceSen: Math.round(Number(parsed.data.price) * 100),
    stock: Number(parsed.data.stock),
    imageUrl,
    active: formData.get("active") === "on",
    createdBy: actor.id,
  });

  revalidateShop();
  return { ok: true, message: "Product created" };
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
  if (image instanceof File && image.size > 0) {
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

  revalidateShop();
  return { ok: true, message: "Product updated" };
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

/**
 * Transitions an order to "paid", reserving stock. Used both for a seller's
 * manual override (verifiedBy set) and automatic gateway confirmation via
 * the Billplz webhook (verifiedBy null — no human verified it).
 */
export async function markOrderPaid(
  order: typeof orders.$inferSelect,
  verifiedBy: string | null,
): Promise<void> {
  if (order.status === "paid") return; // already marked — avoid double stock deduction

  await db
    .update(products)
    .set({ stock: sql`greatest(${products.stock} - ${order.quantity}, 0)` })
    .where(eq(products.id, order.productId));

  await db
    .update(orders)
    .set({
      status: "paid",
      paymentVerifiedBy: verifiedBy,
      paymentVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  revalidateShop();
  revalidatePath(`/old/shop/order/${order.orderNo}`);
}

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
    revalidateShop();
    revalidatePath(`/old/shop/order/${order.orderNo}`);
    return { ok: true, message: `Order ${order.orderNo} → paid` };
  }

  // Cancelling a paid order returns the reserved stock.
  if (
    status === "cancelled" &&
    (order.status === "paid" || order.status === "processing")
  ) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${order.quantity}` })
      .where(eq(products.id, order.productId));
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidateShop();
  revalidatePath(`/old/shop/order/${order.orderNo}`);
  return { ok: true, message: `Order ${order.orderNo} → ${status}` };
}
