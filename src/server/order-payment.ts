import "server-only";

import { logActivity } from "@server/activity-log";
import { db, orders, products, productVariants } from "@server/db";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

// NOT a server action on purpose: this trusts its caller and has no auth
// check. It lives outside the "use server" action files so it can never be
// invoked directly from the client — only via the Billplz webhook, the
// payment sync fallback, and the seller's updateOrderStatus action.

function revalidateShop() {
  updateTag("products");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shop");
  revalidatePath("/");
}

/**
 * Transitions an order to "paid", reserving stock. Used both for a seller's
 * manual override (verifiedBy set) and automatic gateway confirmation via
 * the Billplz webhook (verifiedBy null — no human verified it).
 */
export async function markOrderPaid(
  order: typeof orders.$inferSelect,
  verifiedBy: string | null,
): Promise<void> {
  // Joki split payment: the first paid bill is the 50% deposit (boost can
  // start), the second is the balance (order complete). No stock is involved
  // — joki orders hang off a zero-stock anchor product.
  if (order.jokiDetails && order.depositSen) {
    if (!order.depositPaidAt) {
      await db
        .update(orders)
        .set({
          status: "paid",
          depositPaidAt: new Date(),
          // cleared so the settled deposit bill can't be re-read as the
          // balance payment by the Billplz sync fallback
          billplzBillId: null,
          paymentVerifiedBy: verifiedBy,
          paymentVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      await logActivity({
        action: "update",
        entityType: "order",
        entityId: order.id,
        description: `Joki order ${order.orderNo}: 50% deposit paid — boost can start`,
      });
    } else if (!order.balancePaidAt) {
      await db
        .update(orders)
        .set({
          status: "completed",
          balancePaidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      await logActivity({
        action: "update",
        entityType: "order",
        entityId: order.id,
        description: `Joki order ${order.orderNo}: balance paid — order completed`,
      });
    }
    revalidateShop();
    return;
  }

  if (order.status === "paid") return; // already marked — avoid double stock deduction

  if (order.variantId) {
    await db
      .update(productVariants)
      .set({
        stock: sql`greatest(${productVariants.stock} - ${order.quantity}, 0)`,
      })
      .where(eq(productVariants.id, order.variantId));
  } else {
    await db
      .update(products)
      .set({ stock: sql`greatest(${products.stock} - ${order.quantity}, 0)` })
      .where(eq(products.id, order.productId));
  }

  await db
    .update(orders)
    .set({
      status: "paid",
      paymentVerifiedBy: verifiedBy,
      paymentVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));
  if (!verifiedBy) {
    await logActivity({
      action: "update",
      entityType: "order",
      entityId: order.id,
      description: `Automatically marked order ${order.orderNo} as paid`,
    });
  }

  revalidateShop();
}
