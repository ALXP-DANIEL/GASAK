"use client";

import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import { formatRM } from "@lib/format";
import { ACCOUNT_ENQUIRY_STATUS_LABELS } from "@lib/labels";
import {
  deleteAccountEnquiry,
  updateAccountEnquiryStatus,
} from "@server/actions/account-enquiries";
import type { AccountEnquiry, AccountEnquiryStatus } from "@server/db/schema";
import { useTransition } from "react";
import { toast } from "sonner";

export type EnquiryRow = AccountEnquiry & {
  product: { id: string; name: string } | null;
};

const STATUS_VARIANT: Record<
  AccountEnquiryStatus,
  "default" | "secondary" | "outline"
> = {
  new: "default",
  contacted: "secondary",
  closed: "outline",
};

/**
 * Opens WhatsApp addressed to the buyer. This runs on the seller's own device,
 * so the message is sent from whatever number their WhatsApp is signed in as —
 * no shop number needs to be configured anywhere.
 */
function contactBuyer(enquiry: EnquiryRow) {
  const message = [
    `Hi ${enquiry.buyerName}, thanks for your interest in`,
    `"${enquiry.product?.name ?? "our account listing"}" (${formatRM(enquiry.priceSenAtEnquiry)}).`,
    "",
    "I'll send the payment QR and account details here.",
  ].join(" ");
  // wa.me needs a bare international number with no punctuation.
  const number = enquiry.buyerPhone.replace(/\D/g, "");
  window.open(
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function EnquiriesList({ rows }: { rows: EnquiryRow[] }) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, status: AccountEnquiryStatus) {
    startTransition(async () => {
      const result = await updateAccountEnquiryStatus(id, status);
      result.ok
        ? toast.success(result.message ?? "Updated")
        : toast.error(result.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAccountEnquiry(id);
      result.ok
        ? toast.success(result.message ?? "Deleted")
        : toast.error(result.error);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="border border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
        No buyer enquiries yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((enquiry) => (
        <div
          key={enquiry.id}
          className="grid gap-4 border border-border bg-card/60 p-4 desktop:grid-cols-[1fr_auto] desktop:items-center"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {enquiry.buyerName}
              </span>
              <Badge variant={STATUS_VARIANT[enquiry.status]}>
                {ACCOUNT_ENQUIRY_STATUS_LABELS[enquiry.status]}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {enquiry.product?.name ?? "Listing deleted"} ·{" "}
              {formatRM(enquiry.priceSenAtEnquiry)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {enquiry.buyerPhone} · {enquiry.buyerEmail} ·{" "}
              {enquiry.createdAt.toLocaleDateString("en-MY", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {enquiry.note && (
              <p className="mt-2 whitespace-pre-line border-l-2 border-border pl-3 text-sm text-muted-foreground">
                {enquiry.note}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                contactBuyer(enquiry);
                // Opening the chat is the act of making contact.
                if (enquiry.status === "new")
                  setStatus(enquiry.id, "contacted");
              }}
            >
              Contact buyer
            </Button>
            {enquiry.status !== "closed" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setStatus(enquiry.id, "closed")}
              >
                Close
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => remove(enquiry.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
