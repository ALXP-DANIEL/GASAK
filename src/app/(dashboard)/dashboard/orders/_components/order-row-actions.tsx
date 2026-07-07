"use client";

import {
  Diawer,
  DiawerContent,
  DiawerHeader,
  DiawerTitle,
  DiawerTrigger,
} from "@components/ui/diawer";
import { Button } from "@components/ui/shadcn/button";
import { updateOrderStatus } from "@server/actions/shop";
import type { Order, OrderStatus, Product } from "@server/db/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
  const actions = NEXT_ACTIONS[order.status] ?? [];
  const canCancel =
    order.status !== "completed" && order.status !== "cancelled";

  function setStatus(status: OrderStatus) {
    startTransition(async () => {
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
        <Diawer>
          <DiawerTrigger asChild>
            <Button variant="outline" size="sm">
              View proof
            </Button>
          </DiawerTrigger>
          <DiawerContent>
            <DiawerHeader>
              <DiawerTitle>Payment proof — {order.orderNo}</DiawerTitle>
            </DiawerHeader>
            <div className="relative h-96 w-full overflow-hidden border">
              <Image
                src={order.paymentProofUrl}
                alt="Payment proof"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </DiawerContent>
        </Diawer>
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
