import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { BrandBadge, BrandCard, PageHero } from "@components/ui/brand";
import { Separator } from "@components/ui/shadcn/separator";
import { formatDateTime, formatRM } from "@lib/format";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@lib/labels";
import { syncBillplzPayment } from "@server/actions/public";
import { db, orders } from "@server/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
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

  // Joki split payment: 50% deposit before the boost, balance after it's done.
  const splitPayment = !!order.jokiDetails && !!order.depositSen;
  const depositSen = order.depositSen ?? 0;
  const balanceSen = order.totalSen - depositSen;
  const awaitingBalance =
    splitPayment && !!order.depositPaidAt && !order.balancePaidAt && !cancelled;

  return (
    <PageSkeleton name="shop-order" loading={false}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 desktop:px-8 desktop:py-14">
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
              <span className="font-medium">
                {order.jokiDetails?.packageName
                  ? `Joki — ${order.jokiDetails.packageName}`
                  : order.jokiDetails?.currentRank &&
                      order.jokiDetails.targetRank
                    ? `Joki — ${order.jokiDetails.currentRank} → ${order.jokiDetails.targetRank}`
                    : order.product.name}
              </span>
            </div>
            {order.variantLabel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Options</span>
                <span>{order.variantLabel}</span>
              </div>
            )}
            {order.jokiDetails?.mode === "per_star" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stars</span>
                  <span>{order.quantity} ⭐</span>
                </div>
                {order.jokiDetails.starLegs?.map((leg) => (
                  <div
                    key={leg.tierName}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>
                      {leg.tierName} × {leg.stars}⭐
                    </span>
                    <span>{formatRM(leg.priceSen)}</span>
                  </div>
                ))}
              </>
            ) : (
              !order.jokiDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit price</span>
                    <span>{formatRM(order.unitPriceSen)}</span>
                  </div>
                </>
              )
            )}
            {order.jokiDetails && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MLBB ID</span>
                  <span>{order.jokiDetails.mlbbId}</span>
                </div>
                {order.jokiDetails.currentRank && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current rank</span>
                    <span>{order.jokiDetails.currentRank}</span>
                  </div>
                )}
                {order.jokiDetails.targetRank && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target rank</span>
                    <span>{order.jokiDetails.targetRank}</span>
                  </div>
                )}
              </>
            )}
            {order.shippingAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ship to</span>
                <span className="text-right">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && (
                    <>
                      <br />
                      {order.shippingAddress.line2}
                    </>
                  )}
                  <br />
                  {order.shippingAddress.postcode} {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatRM(order.totalSen)}</span>
            </div>
            {splitPayment && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Deposit (50%){order.depositPaidAt ? " — paid" : ""}
                  </span>
                  <span>{formatRM(depositSen)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Balance after boost{order.balancePaidAt ? " — paid" : ""}
                  </span>
                  <span>{formatRM(balanceSen)}</span>
                </div>
              </>
            )}
          </div>
        </BrandCard>

        {awaitingPayment && (
          <BrandCard className="p-6">
            <h2 className="font-heading text-xl font-bold tracking-wide">
              {splitPayment ? "Pay 50% deposit to start" : "Complete payment"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {splitPayment
                ? `Pay the ${formatRM(depositSen)} deposit securely via Billplz to start your boost. The remaining ${formatRM(balanceSen)} is only due after the joki is done — we'll contact you on WhatsApp.`
                : `Pay ${formatRM(order.totalSen)} securely via Billplz — choose DuitNow QR, FPX online banking, or a card on the next screen.`}
            </p>
            <div className="mt-5">
              <PaymentForm orderNo={order.orderNo} />
            </div>
          </BrandCard>
        )}

        {awaitingBalance && (
          <BrandCard className="p-6">
            <h2 className="font-heading text-xl font-bold tracking-wide">
              Pay remaining balance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Deposit received — your boost is underway. Once our joki confirms
              the boost is done (we'll contact you on WhatsApp), settle the
              remaining {formatRM(balanceSen)} here to complete the order.
            </p>
            <div className="mt-5">
              <PaymentForm orderNo={order.orderNo} />
            </div>
          </BrandCard>
        )}
      </div>
    </PageSkeleton>
  );
}
