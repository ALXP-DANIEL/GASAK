"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { formatRM } from "@lib/format";
import { updateOrderStatus } from "@server/actions/shop";
import type { Order, OrderStatus, Product } from "@server/db/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

const NEXT_ACTIONS: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }[]>
> = {
  pending: [{ status: "waiting_payment", label: "Mark awaiting payment" }],
  waiting_payment: [{ status: "paid", label: "Verify payment" }],
  paid: [{ status: "processing", label: "Start processing" }],
  processing: [{ status: "completed", label: "Mark completed" }],
};

export function OrderRowActions({
  order,
}: {
  order: Order & { product: Product };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Flip the available actions immediately; reverts if the action fails.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(order.status);
  const actions = NEXT_ACTIONS[optimisticStatus] ?? [];
  const canCancel =
    optimisticStatus !== "completed" && optimisticStatus !== "cancelled";

  function setStatus(status: OrderStatus) {
    startTransition(async () => {
      setOptimisticStatus(status);
      const result = await updateOrderStatus(order.id, status);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  const shipping = order.shippingAddress;
  const joki = order.jokiDetails;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Credenza>
        <CredenzaTrigger asChild>
          <Button variant="outline" size="sm">
            Details
          </Button>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Order {order.orderNo}</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="grid gap-2.5">
            <DetailRow
              label="Product"
              value={`${order.product.name} x ${order.quantity}`}
            />
            {order.variantLabel && (
              <DetailRow label="Options" value={order.variantLabel} />
            )}
            <DetailRow label="Total" value={formatRM(order.totalSen)} />
            <DetailRow label="Customer" value={order.customerName} />
            <DetailRow label="Phone" value={order.customerPhone} />
            <DetailRow label="Email" value={order.customerEmail} />
            {joki && (
              <>
                <DetailRow label="MLBB ID" value={joki.mlbbId} />
                {joki.currentRank && joki.targetRank && (
                  <DetailRow
                    label="Boost"
                    value={`${joki.currentRank} → ${joki.targetRank}`}
                  />
                )}
                {order.depositSen != null && (
                  <DetailRow
                    label="Deposit (50%)"
                    value={`${formatRM(order.depositSen)} — ${
                      order.depositPaidAt ? "paid" : "unpaid"
                    }`}
                  />
                )}
              </>
            )}
            {shipping && (
              <DetailRow
                label="Ship to"
                value={[
                  shipping.line1,
                  shipping.line2,
                  `${shipping.postcode} ${shipping.city}`,
                  shipping.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      {order.paymentProofUrl && (
        <Credenza>
          <CredenzaTrigger asChild>
            <Button variant="outline" size="sm">
              View proof
            </Button>
          </CredenzaTrigger>
          <CredenzaContent>
            <CredenzaHeader>
              <CredenzaTitle>Payment proof — {order.orderNo}</CredenzaTitle>
            </CredenzaHeader>
            <div className="relative h-96 w-full overflow-hidden border">
              <Image
                src={order.paymentProofUrl}
                alt="Payment proof"
                fill
                className="object-contain"
              />
            </div>
          </CredenzaContent>
        </Credenza>
      )}

      {actions.map((action) => (
        <Button
          key={action.status}
          size="sm"
          disabled={pending}
          onClick={() => setStatus(action.status)}
        >
          {action.label}
        </Button>
      ))}

      {canCancel && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setStatus("cancelled")}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
