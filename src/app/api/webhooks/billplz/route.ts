import { verifyBillplzWebhookSignature } from "@lib/billplz";
import { markOrderPaid } from "@server/actions/shop";
import { db, orders } from "@server/db";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  if (!verifyBillplzWebhookSignature(fields)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const billId = fields.id;
  if (!billId) return new Response("Missing bill id", { status: 400 });

  const order = await db.query.orders.findFirst({
    where: eq(orders.billplzBillId, billId),
  });
  if (!order) return new Response("Order not found", { status: 404 });

  if (fields.paid === "true") {
    await markOrderPaid(order, null);
  }

  // Billplz retries on non-2xx, so always ack once handled.
  return new Response("OK", { status: 200 });
}
