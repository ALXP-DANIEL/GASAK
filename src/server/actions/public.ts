"use server";

import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createBillplzBill, getBillplzBill } from "@/lib/billplz";
import { applications, db, laneEnum, orders, products } from "@/server/db";
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
  currentRank: z.string().min(1, "Current rank is required"),
  preferredLane: z.enum(laneEnum.enumValues),
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

  await db.insert(applications).values({
    ...parsed.data,
    previousTeam: parsed.data.previousTeam || null,
  });

  revalidatePath("/dashboard/recruitment");
  return {
    ok: true,
    message: "Application received! We will contact you by email.",
  };
}

const checkoutSchema = z.object({
  productId: z.uuid(),
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
  if (product.stock < parsed.data.quantity) {
    return { ok: false, error: "Not enough stock for that quantity" };
  }

  const orderNo = generateOrderNo();
  await db.insert(orders).values({
    orderNo,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerEmail: parsed.data.customerEmail,
    productId: product.id,
    quantity: parsed.data.quantity,
    unitPriceSen: product.priceSen,
    totalSen: product.priceSen * parsed.data.quantity,
    status: "pending",
  });

  revalidatePath("/dashboard/orders");
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

  revalidatePath(`/shop/order/${order.orderNo}`);
  revalidatePath("/dashboard/orders");
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
