"use server";

import { randomInt } from "node:crypto";
import {
  computeJokiPackagePath,
  computeJokiStarPath,
  resolveJokiTier,
} from "@lib/joki";
import { canonicalizeLanes } from "@lib/labels";
import { formatRank, rankFieldSchema } from "@lib/ranks";
import { logActivity } from "@server/activity-log";
import { createBillplzBill, getBillplzBill } from "@server/billplz";
import {
  applications,
  db,
  type JokiOrderDetails,
  jokiPackages,
  jokiTiers,
  laneEnum,
  orders,
  products,
  productVariants,
  squads,
} from "@server/db";
import { markOrderPaid } from "@server/order-payment";
import { RATE_LIMITED_ERROR, rateLimit } from "@server/rate-limit";
import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

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

  if (!(await rateLimit("application", 3, 60 * 60 * 1000))) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }
  // Durable cap: one pending application per email per day.
  const [recent] = await db
    .select({ n: count() })
    .from(applications)
    .where(
      and(
        eq(applications.email, parsed.data.email),
        gte(applications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    );
  if ((recent?.n ?? 0) >= 1) {
    return {
      ok: false,
      error: "You already applied recently — we'll be in touch by email.",
    };
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

const shippingAddressSchema = z.object({
  line1: z.string().min(3, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(1, "Enter your city"),
  state: z.string().min(1, "Enter your state"),
  postcode: z.string().min(4, "Enter a valid postcode"),
});

const checkoutSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  quantity: z.coerce.number().int().min(1).max(99),
  shippingAddress: shippingAddressSchema.optional(),
});

function generateOrderNo() {
  // 10 chars over a 31-symbol alphabet ≈ 8×10^14 combinations — the order
  // number doubles as the access token for the public order page (which
  // shows customer PII), so it must resist brute-force enumeration.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) code += chars[randomInt(chars.length)];
  return `GSK-${code}`;
}

// Durable per-customer cap: counts recent orders for an email so the limit
// holds across serverless instances (the in-memory IP limit does not).
async function recentOrdersExceed(
  customerEmail: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(orders)
    .where(
      and(
        eq(orders.customerEmail, customerEmail),
        gte(orders.createdAt, new Date(Date.now() - windowMs)),
      ),
    );
  return (row?.n ?? 0) >= limit;
}

const ORDER_LIMIT = { perIp: 5, perEmail: 5, windowMs: 15 * 60 * 1000 };

export async function placeOrder(
  input: z.infer<typeof checkoutSchema>,
): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (
    !(await rateLimit("place-order", ORDER_LIMIT.perIp, ORDER_LIMIT.windowMs))
  ) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }
  if (
    await recentOrdersExceed(
      parsed.data.customerEmail,
      ORDER_LIMIT.perEmail,
      ORDER_LIMIT.windowMs,
    )
  ) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
  });
  if (!product?.active) {
    return { ok: false, error: "This product is no longer available" };
  }

  let unitPriceSen = product.priceSen;
  let availableStock = product.stock;
  let variantLabel: string | null = null;

  if (product.hasVariants) {
    if (!parsed.data.variantId) {
      return { ok: false, error: "Please select the product options" };
    }
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, parsed.data.variantId),
      with: { optionValues: { with: { optionValue: true } } },
    });
    if (!variant || variant.productId !== product.id || !variant.active) {
      return { ok: false, error: "Selected option is not available" };
    }
    unitPriceSen = variant.priceSen;
    availableStock = variant.stock;
    variantLabel =
      variant.optionValues.map((v) => v.optionValue.value).join(" · ") || null;
  }

  if (availableStock < parsed.data.quantity) {
    return { ok: false, error: "Not enough stock for that quantity" };
  }

  if (product.category === "merchandise" && !parsed.data.shippingAddress) {
    return { ok: false, error: "Enter a delivery address for this item" };
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
      variantLabel,
      quantity: parsed.data.quantity,
      unitPriceSen,
      totalSen: unitPriceSen * parsed.data.quantity,
      status: "pending",
      shippingAddress:
        product.category === "merchandise" ? parsed.data.shippingAddress : null,
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

// Hidden anchor product that joki orders attach to so they flow through the
// shared orders/payment/webhook pipeline. Kept out of the shop listing by
// having zero stock (the listing filters stock > 0); placeJokiOrder computes
// price from the joki catalog instead of this row.
const JOKI_ANCHOR_PRODUCT_NAME = "Joki Rank Boost";

async function resolveJokiAnchorProduct() {
  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.name, JOKI_ANCHOR_PRODUCT_NAME),
      eq(products.category, "joki"),
    ),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(products)
    .values({
      name: JOKI_ANCHOR_PRODUCT_NAME,
      category: "joki",
      description:
        "MLBB rank boost by GASAK players — priced per star or by package.",
      priceSen: 0,
      stock: 0,
      active: true,
    })
    .returning();
  return row;
}

const jokiCheckoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  mlbbId: z.string().min(4, "Enter a valid MLBB ID"),
  mode: z.enum(["per_star", "package"]),
  fromRank: rankFieldSchema,
  toRank: rankFieldSchema,
});

export async function placeJokiOrder(
  input: z.infer<typeof jokiCheckoutSchema>,
): Promise<ActionResult> {
  const parsed = jokiCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  if (
    !(await rateLimit("place-order", ORDER_LIMIT.perIp, ORDER_LIMIT.windowMs))
  ) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }
  if (
    await recentOrdersExceed(
      data.customerEmail,
      ORDER_LIMIT.perEmail,
      ORDER_LIMIT.windowMs,
    )
  ) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }
  const currentRank = formatRank(data.fromRank);
  const targetRank = formatRank(data.toRank);

  const [tiers, packages] = await Promise.all([
    db.query.jokiTiers.findMany({ where: eq(jokiTiers.active, true) }),
    db.query.jokiPackages.findMany({ where: eq(jokiPackages.active, true) }),
  ]);

  let unitPriceSen: number;
  let quantity: number;
  let totalSen: number;
  let details: JokiOrderDetails;
  let summary: string;

  if (data.mode === "per_star") {
    const path = computeJokiStarPath(tiers, data.fromRank, data.toRank);
    if (!path) {
      return {
        ok: false,
        error: "That range isn't boostable with the current joki catalog",
      };
    }
    quantity = path.totalStars;
    unitPriceSen = Math.round(path.totalSen / path.totalStars);
    details = {
      mlbbId: data.mlbbId,
      mode: "per_star",
      currentRank,
      targetRank,
      stars: path.totalStars,
      starLegs: path.legs.map((leg) => ({
        tierName: leg.tierName,
        stars: leg.stars,
        priceSen: leg.priceSen,
      })),
    };
    summary = `${currentRank} → ${targetRank} (${path.totalStars}⭐)`;
    totalSen = path.totalSen;
  } else {
    const fromTier = resolveJokiTier(tiers, data.fromRank);
    const toTier = resolveJokiTier(tiers, data.toRank);
    if (!fromTier || !toTier) {
      return {
        ok: false,
        error: "That range isn't boostable with the current joki catalog",
      };
    }
    const path = computeJokiPackagePath(
      tiers,
      packages,
      fromTier.id,
      toTier.id,
    );
    if (!path) {
      return {
        ok: false,
        error: "No package covers that range — try per-star pricing",
      };
    }
    quantity = 1;
    unitPriceSen = path.totalSen;
    totalSen = path.totalSen;
    details = {
      mlbbId: data.mlbbId,
      mode: "package",
      currentRank,
      targetRank,
      packageName: `${fromTier.name} → ${toTier.name}`,
    };
    summary = `${fromTier.name} → ${toTier.name}`;
  }

  const anchor = await resolveJokiAnchorProduct();
  const orderNo = generateOrderNo();
  const [row] = await db
    .insert(orders)
    .values({
      orderNo,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      productId: anchor.id,
      quantity,
      unitPriceSen,
      totalSen,
      status: "pending",
      jokiDetails: details,
      // 50% deposit before the boost starts; balance collected after it's done
      depositSen: Math.ceil(totalSen / 2),
    })
    .returning();
  await logActivity({
    action: "create",
    entityType: "order",
    entityId: row.id,
    description: `New joki order ${row.orderNo} — ${summary}`,
  });

  revalidatePath("/dashboard/orders");
  return { ok: true, data: { orderNo } };
}

export async function createBillplzPayment(
  orderNo: string,
): Promise<ActionResult> {
  if (!(await rateLimit("billplz-pay", 10, 15 * 60 * 1000))) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNo, orderNo),
    with: { product: true },
  });
  if (!order) return { ok: false, error: "Order not found" };

  // Joki split payment: leg 1 is the 50% deposit, leg 2 the balance after
  // the boost is done. Regular orders pay the full total in one bill.
  const splitPayment = !!order.jokiDetails && !!order.depositSen;
  const balanceLeg = splitPayment && !!order.depositPaidAt;

  if (balanceLeg) {
    if (order.balancePaidAt || order.status === "cancelled") {
      return { ok: false, error: "This order can no longer be paid" };
    }
  } else if (order.status !== "pending" && order.status !== "waiting_payment") {
    return { ok: false, error: "This order can no longer be paid" };
  }

  const amountSen = splitPayment
    ? balanceLeg
      ? // biome-ignore lint/style/noNonNullAssertion: splitPayment implies depositSen
        order.totalSen - order.depositSen!
      : // biome-ignore lint/style/noNonNullAssertion: splitPayment implies depositSen
        order.depositSen!
    : order.totalSen;
  const legLabel = splitPayment
    ? balanceLeg
      ? " — Balance (50%)"
      : " — Deposit (50%)"
    : "";

  let bill: Awaited<ReturnType<typeof createBillplzBill>>;
  try {
    bill = await createBillplzBill({
      name: order.customerName,
      email: order.customerEmail,
      mobile: order.customerPhone,
      amountSen,
      description: `${order.product.name} × ${order.quantity} — ${order.orderNo}${legLabel}`,
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
      // The balance leg is paid while the boost is underway — don't regress
      // the status ladder back to waiting_payment.
      status: balanceLeg ? order.status : "waiting_payment",
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
  if (!order?.billplzBillId) return;
  // Sync applies while awaiting the (first or only) payment, or while a joki
  // balance bill is outstanding. markOrderPaid clears billplzBillId when the
  // deposit leg settles, so a paid deposit bill can't be mistaken for the
  // balance here.
  const awaitingJokiBalance =
    !!order.jokiDetails &&
    !!order.depositSen &&
    !!order.depositPaidAt &&
    !order.balancePaidAt &&
    order.status !== "cancelled";
  if (order.status !== "waiting_payment" && !awaitingJokiBalance) return;

  try {
    const bill = await getBillplzBill(order.billplzBillId);
    if (bill.paid) await markOrderPaid(order, null);
  } catch {
    // Billplz unreachable or not configured — the webhook remains the
    // authoritative source of truth, so silently skip this best-effort sync.
  }
}
