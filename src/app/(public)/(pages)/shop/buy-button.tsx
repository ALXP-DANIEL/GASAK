"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { formatRM } from "@/lib/format";
import { placeOrder } from "@/server/actions/public";
import type { Product } from "@/server/db/schema";

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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const quantity = watch("quantity") || 1;

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await placeOrder({ ...values, productId: product.id });
      if (result.ok && result.data?.orderNo) {
        toast.success("Order placed! Complete your payment.");
        router.push(`/shop/order/${result.data.orderNo}`);
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
          <div className="grid gap-2">
            <Label htmlFor="customerName">Name</Label>
            <Input id="customerName" {...register("customerName")} />
            {errors.customerName && (
              <p className="text-sm text-destructive">
                {errors.customerName.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerPhone">Phone (WhatsApp)</Label>
            <Input
              id="customerPhone"
              placeholder="+60…"
              {...register("customerPhone")}
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive">
                {errors.customerPhone.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              {...register("customerEmail")}
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive">
                {errors.customerEmail.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={Math.min(product.stock, 99)}
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>
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
