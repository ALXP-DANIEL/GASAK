import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle";
import { XCircle } from "@phosphor-icons/react/dist/ssr/XCircle";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Separator } from "@/components/ui/shadcn/separator";
import { formatDateTime, formatRM } from "@/lib/format";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/labels";
import { syncBillplzPayment } from "@/server/actions/public";
import { db, orders } from "@/server/db";
import { PaymentForm } from "./payment-form";

export const dynamic = "force-dynamic";

export default async function OrderPage(
  props: PageProps<"/shop/order/[orderNo]">,
) {
  const { orderNo } = await props.params;
  const decodedOrderNo = decodeURIComponent(orderNo);

  // Reconciles with Billplz in case the browser redirect back here beat
  // the webhook, or the webhook delivery failed.
  await syncBillplzPayment(decodedOrderNo);

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNo, decodedOrderNo),
    with: { product: true },
  });

  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const awaitingPayment =
    order.status === "pending" || order.status === "waiting_payment";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Order {order.orderNo}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Placed {formatDateTime(order.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Status</CardTitle>
            <Badge variant={cancelled ? "destructive" : "secondary"}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {cancelled ? (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle size={20} />
              <p className="text-sm">
                This order was cancelled. Contact us if you think this is a
                mistake.
              </p>
            </div>
          ) : (
            <ol className="grid gap-2">
              {ORDER_STATUS_FLOW.map((status, i) => (
                <li key={status} className="flex items-center gap-3">
                  {i <= currentIndex ? (
                    <CheckCircle
                      size={20}
                      weight="fill"
                      className="text-primary"
                    />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                  <span
                    className={
                      i <= currentIndex
                        ? "text-sm font-medium"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product</span>
            <span className="font-medium">{order.product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span>{order.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit price</span>
            <span>{formatRM(order.unitPriceSen)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatRM(order.totalSen)}</span>
          </div>
        </CardContent>
      </Card>

      {awaitingPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complete payment</CardTitle>
            <CardDescription>
              Pay {formatRM(order.totalSen)} securely via Billplz — choose
              DuitNow QR, FPX online banking, or a card on the next screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm orderNo={order.orderNo} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
