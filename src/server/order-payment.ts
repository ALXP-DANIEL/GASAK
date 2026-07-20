import "server-only";

import { logActivity } from "@server/activity-log";
import { db, orders, products, productVariants } from "@server/db";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
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
 *
 * Concurrency-safe: Billplz retries webhooks and the sync fallback can race
 * the webhook, so every transition is a conditional UPDATE — only the caller
 * that actually flips the row performs the side effects (stock deduction,
 * activity log). Losers of the race see zero updated rows and return.
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
      const [row] = await db
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
        .where(and(eq(orders.id, order.id), isNull(orders.depositPaidAt)))
        .returning({ id: orders.id });
      if (!row) return; // another confirmation already recorded the deposit
      await logActivity({
        action: "update",
        entityType: "order",
        entityId: order.id,
        description: `Joki order ${order.orderNo}: 50% deposit paid — boost can start`,
      });
    } else if (!order.balancePaidAt) {
      const [row] = await db
        .update(orders)
        .set({
          status: "completed",
          balancePaidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, order.id),
            isNotNull(orders.depositPaidAt),
            isNull(orders.balancePaidAt),
          ),
        )
        .returning({ id: orders.id });
      if (!row) return; // another confirmation already recorded the balance
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

  // Flip the status first, conditionally — the row update is the lock. Stock
  // is deducted in the same transaction so a crash can't mark an order paid
  // without reserving stock (or vice versa).
  const won = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({
        status: "paid",
        paymentVerifiedBy: verifiedBy,
        paymentVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      // Only transition orders that are actually awaiting payment — a late
      // webhook retry against a paid/processing/completed/cancelled order
      // must not re-deduct stock or downgrade the status.
      .where(
        and(
          eq(orders.id, order.id),
          inArray(orders.status, ["pending", "waiting_payment"]),
        ),
      )
      .returning({ id: orders.id });
    if (!row) return false; // already handled — avoid double stock deduction

    if (order.variantId) {
      await tx
        .update(productVariants)
        .set({
          stock: sql`greatest(${productVariants.stock} - ${order.quantity}, 0)`,
        })
        .where(eq(productVariants.id, order.variantId));
    } else {
      await tx
        .update(products)
        .set({ stock: sql`greatest(${products.stock} - ${order.quantity}, 0)` })
        .where(eq(products.id, order.productId));
    }
    return true;
  });
  if (!won) return;

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
