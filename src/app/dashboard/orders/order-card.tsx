"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { formatDateTime, formatRM } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { updateOrderStatus } from "@/server/actions/shop";
import type { Order, OrderStatus, Product } from "@/server/db/schema";

const STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  waiting_payment: "secondary",
  paid: "default",
  processing: "default",
  completed: "default",
  cancelled: "destructive",
};

const NEXT_ACTIONS: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }[]>
> = {
  pending: [{ status: "waiting_payment", label: "Mark awaiting payment" }],
  waiting_payment: [{ status: "paid", label: "Verify payment ✓" }],
  paid: [{ status: "processing", label: "Start processing" }],
  processing: [{ status: "completed", label: "Mark completed" }],
};

export function OrderCard({ order }: { order: Order & { product: Product } }) {
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
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{order.orderNo}</CardTitle>
            <CardDescription>{formatDateTime(order.createdAt)}</CardDescription>
          </div>
          <Badge variant={STATUS_VARIANTS[order.status]}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="grid gap-1">
          <p className="font-medium">
            {order.product.name} × {order.quantity} — {formatRM(order.totalSen)}
          </p>
          <p className="text-muted-foreground">
            {order.customerName} · {order.customerPhone} · {order.customerEmail}
          </p>
          {order.paymentMethod && (
            <p className="text-muted-foreground">
              Paid via {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {order.paymentProofUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View payment proof
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Payment proof — {order.orderNo}</DialogTitle>
                </DialogHeader>
                <div className="relative h-96 w-full overflow-hidden rounded-lg border">
                  <Image
                    src={order.paymentProofUrl}
                    alt="Payment proof"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </DialogContent>
            </Dialog>
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
      </CardContent>
    </Card>
  );
}
