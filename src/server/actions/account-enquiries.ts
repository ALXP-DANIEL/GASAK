"use server";

import { toMalaysiaPhone } from "@lib/phone";
import { logActivity } from "@server/activity-log";
import { actionUser } from "@server/authz";
import {
  accountEnquiries,
  accountEnquiryStatusEnum,
  db,
  products,
} from "@server/db";
import { RATE_LIMITED_ERROR, rateLimit } from "@server/rate-limit";
import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./public";

const enquirySchema = z.object({
  productId: z.uuid(),
  name: z.string().min(2, "Name is required").max(120),
  phone: z.string().min(6, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  note: z.string().max(1000).optional(),
});

/** Per-buyer cap, so one email cannot flood a seller's inbox. */
const PER_EMAIL_LIMIT = 5;
const PER_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Public: a buyer registers interest in an account listing.
 *
 * Nothing is charged and no WhatsApp window is opened for the buyer — the
 * enquiry is stored and the seller makes contact from their own number to
 * arrange manual QR payment.
 */
export async function submitAccountEnquiry(
  input: z.infer<typeof enquirySchema>,
): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  if (!(await rateLimit("account-enquiry", 5, 60 * 60 * 1000))) {
    return { ok: false, error: RATE_LIMITED_ERROR };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
    with: { accountDetails: true },
  });
  // Re-check server-side: the listing may have sold or been hidden between
  // page render (cached for hours) and submit.
  if (product?.category !== "account" || !product.active) {
    return { ok: false, error: "This listing is no longer available" };
  }
  if (product.accountDetails?.sold) {
    return { ok: false, error: "This account has already been sold" };
  }

  const [recent] = await db
    .select({ n: count() })
    .from(accountEnquiries)
    .where(
      and(
        eq(accountEnquiries.buyerEmail, parsed.data.email),
        gte(
          accountEnquiries.createdAt,
          new Date(Date.now() - PER_EMAIL_WINDOW_MS),
        ),
      ),
    );
  if ((recent?.n ?? 0) >= PER_EMAIL_LIMIT) {
    return {
      ok: false,
      error:
        "You have sent several enquiries recently. Please wait for a reply.",
    };
  }

  await db.insert(accountEnquiries).values({
    productId: product.id,
    buyerName: parsed.data.name,
    buyerPhone: toMalaysiaPhone(parsed.data.phone),
    buyerEmail: parsed.data.email,
    note: parsed.data.note || null,
    priceSenAtEnquiry: product.priceSen,
  });

  // No outbound message here by design: the enquiry lands in the dashboard,
  // and the seller opens WhatsApp to the buyer from their own number via the
  // "Contact buyer" action. Nothing is ever sent from a shop number.
  revalidatePath("/dashboard/products/accounts");
  revalidatePath("/dashboard/products/accounts/enquiries");
  return {
    ok: true,
    message: "Thanks! The seller will contact you on WhatsApp shortly.",
  };
}

/** Seller/admin: move an enquiry through new → contacted → closed. */
export async function updateAccountEnquiryStatus(
  enquiryId: string,
  status: (typeof accountEnquiryStatusEnum.enumValues)[number],
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  if (!accountEnquiryStatusEnum.enumValues.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const [row] = await db
    .update(accountEnquiries)
    .set({
      status,
      handledBy: actor.id,
      handledAt: new Date(),
    })
    .where(eq(accountEnquiries.id, enquiryId))
    .returning();
  if (!row) return { ok: false, error: "Enquiry not found" };

  await logActivity({
    actor,
    action: "update",
    entityType: "account_enquiry",
    entityId: row.id,
    description: `Marked enquiry from "${row.buyerName}" as ${status}`,
  });

  revalidatePath("/dashboard/products/accounts/enquiries");
  return { ok: true, message: `Marked as ${status}` };
}

/** Seller/admin: remove an enquiry once it is done with. */
export async function deleteAccountEnquiry(
  enquiryId: string,
): Promise<ActionResult> {
  const actor = await actionUser("admin", "seller");
  if (!actor) return { ok: false, error: "Unauthorized" };

  const [row] = await db
    .delete(accountEnquiries)
    .where(eq(accountEnquiries.id, enquiryId))
    .returning();
  if (!row) return { ok: false, error: "Enquiry not found" };

  await logActivity({
    actor,
    action: "delete",
    entityType: "account_enquiry",
    entityId: row.id,
    description: `Deleted enquiry from "${row.buyerName}"`,
  });

  revalidatePath("/dashboard/products/accounts/enquiries");
  return { ok: true, message: "Enquiry deleted" };
}
