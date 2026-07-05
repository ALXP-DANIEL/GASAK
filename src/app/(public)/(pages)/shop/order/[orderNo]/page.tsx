import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Icons } from "@/components/icons";
import { BrandBadge, BrandCard, PageHero } from "@/components/ui/brand";
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
      <PageHero
        eyebrow="Order Status"
        title={`Order ${order.orderNo}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
      />

      <BrandCard className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Status
          </h2>
          <BrandBadge
            className={
              cancelled
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : ""
            }
          >
            {ORDER_STATUS_LABELS[order.status]}
          </BrandBadge>
        </div>
        <div className="mt-5">
          {cancelled ? (
            <div className="flex items-center gap-2 text-destructive">
              <Icons.Status.Failed size={20} />
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
                    <Icons.Status.Success
                      size={20}
                      weight="fill"
                      className="text-primary"
                    />
                  ) : (
                    <Icons.Status.Pending
                      size={20}
                      className="text-muted-foreground"
                    />
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
        </div>
      </BrandCard>

      <BrandCard className="p-6">
        <h2 className="font-heading text-xl font-bold tracking-wide">
          Summary
        </h2>
        <div className="mt-5 grid gap-2 text-sm">
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
        </div>
      </BrandCard>

      {awaitingPayment && (
        <BrandCard className="p-6">
          <h2 className="font-heading text-xl font-bold tracking-wide">
            Complete payment
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pay {formatRM(order.totalSen)} securely via Billplz — choose DuitNow
            QR, FPX online banking, or a card on the next screen.
          </p>
          <div className="mt-5">
            <PaymentForm orderNo={order.orderNo} />
          </div>
        </BrandCard>
      )}
    </div>
  );
}
