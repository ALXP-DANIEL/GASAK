"use client";

import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { updateOrderStatus } from "@server/actions/shop";
import type { Order, OrderStatus, Product } from "@server/db/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

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

  return (
    <div className="flex flex-wrap justify-end gap-2">
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
