"use client";

import { FormField } from "@components/forms/form-field";
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

const schema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  quantity: z.number("Enter a quantity").int().min(1, "Minimum 1").max(99),
});

type Values = z.infer<typeof schema>;

export function BuyButton({ product }: { product: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      quantity: 1,
    },
  });

  const quantity = useWatch({ control, name: "quantity" }) || 1;

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await placeOrder({ ...values, productId: product.id });
      if (result.ok && result.data?.orderNo) {
        toast.success("Order placed! Complete your payment.");
        router.push(`/pricing/order/${result.data.orderNo}`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Buy now</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            Guest checkout — no account needed. We deliver via your MLBB ID or
            WhatsApp after payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="customerName" label="Name" />
          <FormField
            control={control}
            name="customerPhone"
            label="Phone (WhatsApp)"
            placeholder="+60…"
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
          <Button type="submit" disabled={pending}>
            {pending
              ? "Placing order…"
              : `Place order — ${formatRM(product.priceSen * quantity)}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
