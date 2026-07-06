"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { createBillplzPayment } from "@/server/actions/public";

export function PaymentForm({ orderNo }: { orderNo: string }) {
  const [pending, startTransition] = useTransition();

  function onPay() {
    startTransition(async () => {
      const result = await createBillplzPayment(orderNo);
      if (result.ok && result.data?.url) {
        window.location.href = result.data.url;
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button onClick={onPay} disabled={pending} className="w-full">
      {pending ? "Redirecting…" : "Pay now"}
    </Button>
  );
}
