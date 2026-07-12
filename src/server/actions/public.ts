"use server";

import { randomInt } from "node:crypto";
import { canonicalizeLanes } from "@lib/labels";
import { rankFieldSchema } from "@lib/ranks";
import { logActivity } from "@server/activity-log";
import { createBillplzBill, getBillplzBill } from "@server/billplz";
import {
  applications,
  db,
  laneEnum,
  orders,
  products,
  productVariants,
  squads,
} from "@server/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { markOrderPaid } from "./shop";

export type ActionResult =
  | { ok: true; message?: string; data?: Record<string, string> }
  | { ok: false; error: string };

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  ign: z.string().min(1, "IGN is required"),
  mlbbId: z.string().min(4, "Enter a valid MLBB ID"),
  serverId: z.string().min(1, "Server ID is required"),
  squadId: z.uuid().optional(),
  currentRank: rankFieldSchema,
  preferredLanes: z
    .array(z.enum(laneEnum.enumValues))
    .min(1, "Select at least one lane")
    .transform(canonicalizeLanes),
  heroPool: z.string().min(2, "List a few of your best heroes"),
  previousTeam: z.string().optional(),
  introduction: z.string().min(10, "Tell us a bit about yourself"),
});

export async function submitApplication(
  input: z.infer<typeof applicationSchema>,
): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (parsed.data.squadId) {
    const squad = await db.query.squads.findFirst({
      where: and(
        eq(squads.id, parsed.data.squadId),
        eq(squads.archived, false),
        eq(squads.recruiting, true),
      ),
    });
    if (!squad) {
      return { ok: false, error: "Selected squad is not recruiting" };
    }
  }

  const [row] = await db
    .insert(applications)
    .values({
      ...parsed.data,
      squadId: parsed.data.squadId ?? null,
      previousTeam: parsed.data.previousTeam || null,
    })
    .returning();
  await logActivity({
    action: "create",
    entityType: "application",
    entityId: row.id,
    description: `New public recruitment application from ${row.fullName}`,
  });

  revalidatePath("/dashboard/recruitment");
  return {
    ok: true,
    message: "Application received! We will contact you by email.",
  };
}

const checkoutSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  quantity: z.coerce.number().int().min(1).max(99),
});

function generateOrderNo() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[randomInt(chars.length)];
  return `GSK-${code}`;
}

export async function placeOrder(
  input: z.infer<typeof checkoutSchema>,
): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
  });
  if (!product?.active) {
    return { ok: false, error: "This product is no longer available" };
  }

  let unitPriceSen = product.priceSen;
  let availableStock = product.stock;

  if (product.hasVariants) {
    if (!parsed.data.variantId) {
      return { ok: false, error: "Please select the product options" };
    }
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, parsed.data.variantId),
    });
    if (!variant || variant.productId !== product.id || !variant.active) {
      return { ok: false, error: "Selected option is not available" };
    }
    unitPriceSen = variant.priceSen;
    availableStock = variant.stock;
  }

  if (availableStock < parsed.data.quantity) {
    return { ok: false, error: "Not enough stock for that quantity" };
  }

  const orderNo = generateOrderNo();
  const [row] = await db
    .insert(orders)
    .values({
      orderNo,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerEmail: parsed.data.customerEmail,
      productId: product.id,
      variantId: product.hasVariants ? parsed.data.variantId : null,
      quantity: parsed.data.quantity,
      unitPriceSen,
      totalSen: unitPriceSen * parsed.data.quantity,
      status: "pending",
    })
    .returning();
  await logActivity({
    action: "create",
    entityType: "order",
    entityId: row.id,
    description: `New public order ${row.orderNo} for ${product.name}`,
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/shop");
  updateTag("products");
  return { ok: true, data: { orderNo } };
}

export async function createBillplzPayment(
  orderNo: string,
): Promise<ActionResult> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNo, orderNo),
    with: { product: true },
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "pending" && order.status !== "waiting_payment") {
    return { ok: false, error: "This order can no longer be paid" };
  }

  let bill: Awaited<ReturnType<typeof createBillplzBill>>;
  try {
    bill = await createBillplzBill({
      name: order.customerName,
      email: order.customerEmail,
      mobile: order.customerPhone,
      amountSen: order.totalSen,
      description: `${order.product.name} × ${order.quantity} — ${order.orderNo}`,
      orderNo: order.orderNo,
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  await db
    .update(orders)
    .set({
      billplzBillId: bill.id,
      paymentMethod: "billplz",
      status: "waiting_payment",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));
  await logActivity({
    action: "update",
    entityType: "order",
    entityId: order.id,
    description: `Created Billplz payment link for order ${order.orderNo}`,
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/shop");
  updateTag("products");
  return { ok: true, data: { url: bill.url } };
}

/**
 * Reconciles an order against Billplz directly (fallback for when the
 * browser redirect back from Billplz beats the webhook, or the webhook
 * delivery failed). Safe to call repeatedly — markOrderPaid is idempotent.
 */
export async function syncBillplzPayment(orderNo: string): Promise<void> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNo, orderNo),
  });
  if (!order?.billplzBillId || order.status !== "waiting_payment") return;

  try {
    const bill = await getBillplzBill(order.billplzBillId);
    if (bill.paid) await markOrderPaid(order, null);
  } catch {
    // Billplz unreachable or not configured — the webhook remains the
    // authoritative source of truth, so silently skip this best-effort sync.
  }
}
