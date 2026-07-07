"use client";

import { FormField } from "@components/forms/form-field";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import { Button } from "@components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/shadcn/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatRM } from "@lib/format";
import { placeOrder } from "@server/actions/public";
import type { Product } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const buyButtonSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  quantity: z.number("Enter a quantity").int().min(1, "Minimum 1").max(99),
});

type BuyButtonValues = z.infer<typeof buyButtonSchema>;

export type BuyButtonProps = {
  product: Product;
  variantId?: string;
  /** Resolved unit price (variant price when applicable); defaults to the base product price. */
  unitPriceSen?: number;
};

export function BuyButton({
  product,
  variantId,
  unitPriceSen,
}: BuyButtonProps) {
  const priceSen = unitPriceSen ?? product.priceSen;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { control, handleSubmit } = useForm<BuyButtonValues>({
    resolver: zodResolver(buyButtonSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      quantity: 1,
    },
  });

  const quantity = useWatch({ control, name: "quantity" }) || 1;

  function onSubmit(values: BuyButtonValues) {
    startTransition(async () => {
      const result = await placeOrder({
        ...values,
        customerPhone: toMalaysiaPhone(values.customerPhone),
        productId: product.id,
        variantId,
      });

      if (result.ok && result.data?.orderNo) {
        toast.success("Order placed! Complete your payment.");
        router.push(`/shop/order/${result.data.orderNo}`);
        return;
      }

      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full font-semibold uppercase tracking-wider">
          Buy now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-semibold uppercase tracking-wide">
            {product.name}
          </DialogTitle>
          <DialogDescription>
            Guest checkout. We deliver via your MLBB ID or WhatsApp after
            payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="customerName" label="Name" />
          <PhonePrefixField
            control={control}
            name="customerPhone"
            label="Phone (WhatsApp)"
          />
          <FormField
            control={control}
            name="customerEmail"
            label="Email"
            type="email"
          />
          <FormField
            control={control}
            name="quantity"
            label="Quantity"
            type="number"
          />
          <Button
            type="submit"
            disabled={pending}
            className="font-semibold uppercase tracking-wider"
          >
            {pending
              ? "Placing order..."
              : `Place order — ${formatRM(priceSen * quantity)}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toMalaysiaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");
  return `+60${digits}`;
}
