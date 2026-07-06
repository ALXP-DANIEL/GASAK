import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

const BASE_URL =
  env.BILLPLZ_SANDBOX === "false"
    ? "https://www.billplz.com/api/v3"
    : "https://www.billplz-sandbox.com/api/v3";

function requireCredentials() {
  if (!env.BILLPLZ_API_KEY || !env.BILLPLZ_COLLECTION_ID) {
    throw new Error(
      "Billplz is not configured — set BILLPLZ_API_KEY and BILLPLZ_COLLECTION_ID",
    );
  }
  return {
    apiKey: env.BILLPLZ_API_KEY,
    collectionId: env.BILLPLZ_COLLECTION_ID,
  };
}

function authHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export interface BillplzBill {
  id: string;
  url: string;
  state: "due" | "paid" | "deleted";
  paid: boolean;
  paid_at: string | null;
}

export async function createBillplzBill(input: {
  name: string;
  email: string;
  mobile?: string;
  amountSen: number;
  description: string;
  orderNo: string;
}): Promise<BillplzBill> {
  const { apiKey, collectionId } = requireCredentials();

  const res = await fetch(`${BASE_URL}/bills`, {
    method: "POST",
    headers: {
      Authorization: authHeader(apiKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      collection_id: collectionId,
      email: input.email,
      mobile: input.mobile ?? "",
      name: input.name,
      amount: String(input.amountSen),
      callback_url: `${env.NEXT_PUBLIC_SITE_URL}/api/webhooks/billplz`,
      redirect_url: `${env.NEXT_PUBLIC_SITE_URL}/shop?orderNo=${input.orderNo}`,
      description: input.description,
      reference_1_label: "Order No",
      reference_1: input.orderNo,
    }),
  });

  if (!res.ok) {
    throw new Error(`Billplz create bill failed: ${await res.text()}`);
  }
  return res.json();
}

export async function getBillplzBill(billId: string): Promise<BillplzBill> {
  const { apiKey } = requireCredentials();

  const res = await fetch(`${BASE_URL}/bills/${billId}`, {
    headers: { Authorization: authHeader(apiKey) },
  });
  if (!res.ok) throw new Error(`Billplz get bill failed: ${await res.text()}`);
  return res.json();
}

// Fields Billplz includes in the callback (webhook) X-Signature source
// string, in the order documented at billplz.com/api — see "X Signature".
const CALLBACK_SIGNATURE_KEYS = [
  "amount",
  "collection_id",
  "due_at",
  "email",
  "id",
  "mobile",
  "name",
  "paid_amount",
  "transaction_id",
  "transaction_status",
  "paid_at",
  "paid",
  "state",
  "url",
];

/**
 * Verifies the X-Signature Billplz attaches to server-to-server webhook
 * (callback) requests, so a payment can't be spoofed by posting a fake
 * "paid" body to our webhook endpoint.
 */
export function verifyBillplzWebhookSignature(
  fields: Record<string, string | undefined>,
): boolean {
  const signature = fields.x_signature;
  if (!signature || !env.BILLPLZ_X_SIGNATURE_KEY) return false;

  const parts = CALLBACK_SIGNATURE_KEYS.map((key) => {
    const value = fields[key];
    return value ? `${key}${value}` : null;
  }).filter((p): p is string => p !== null);

  parts.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const expected = createHmac("sha256", env.BILLPLZ_X_SIGNATURE_KEY)
    .update(parts.join("|"))
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return (
    expectedBuf.length === actualBuf.length &&
    timingSafeEqual(expectedBuf, actualBuf)
  );
}
