"use client";

import { FormField } from "@components/forms/form-field";
import { IndexedFormSection } from "@components/forms/form-section";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatRM } from "@lib/format";
import { toMalaysiaPhone } from "@lib/phone";
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
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
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
  const isMerch = product.category === "merchandise";
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
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
    },
  });

  const quantity = useWatch({ control, name: "quantity" }) || 1;

  function onSubmit(values: BuyButtonValues) {
    if (
      isMerch &&
      (!values.addressLine1 ||
        !values.city ||
        !values.state ||
        !values.postcode)
    ) {
      toast.error("Enter a delivery address for this item");
      return;
    }
    startTransition(async () => {
      const result = await placeOrder({
        customerName: values.customerName,
        customerPhone: toMalaysiaPhone(values.customerPhone),
        customerEmail: values.customerEmail,
        quantity: values.quantity,
        productId: product.id,
        variantId,
        shippingAddress: isMerch
          ? {
              // biome-ignore lint/style/noNonNullAssertion: validated above
              line1: values.addressLine1!,
              line2: values.addressLine2 || undefined,
              // biome-ignore lint/style/noNonNullAssertion: validated above
              city: values.city!,
              // biome-ignore lint/style/noNonNullAssertion: validated above
              state: values.state!,
              // biome-ignore lint/style/noNonNullAssertion: validated above
              postcode: values.postcode!,
            }
          : undefined,
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
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button className="w-full font-semibold uppercase tracking-wider">
          Buy now
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{product.name}</CredenzaTitle>
          <CredenzaDescription>
            {isMerch
              ? "Guest checkout. Ships to the address below after payment."
              : "Guest checkout. We deliver via your MLBB ID or WhatsApp after payment."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="p-0">
          <form
            id="buy-form"
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-0"
          >
            <IndexedFormSection
              index="01"
              title="Contact"
              description="Where we'll reach you about this order."
            >
              <div className="grid gap-4">
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
              </div>
            </IndexedFormSection>

            {isMerch && (
              <IndexedFormSection
                index="02"
                title="Delivery"
                description="Physical item — tell us where to ship it."
              >
                <div className="grid gap-4">
                  <FormField
                    control={control}
                    name="addressLine1"
                    label="Address line 1"
                  />
                  <FormField
                    control={control}
                    name="addressLine2"
                    label="Address line 2 (optional)"
                  />
                  <div className="grid gap-4 desktop:grid-cols-2">
                    <FormField control={control} name="city" label="City" />
                    <FormField control={control} name="state" label="State" />
                  </div>
                  <FormField
                    control={control}
                    name="postcode"
                    label="Postcode"
                  />
                </div>
              </IndexedFormSection>
            )}

            <IndexedFormSection
              index={isMerch ? "03" : "02"}
              title="Quantity"
              description="How many you'd like to order."
            >
              <FormField
                control={control}
                name="quantity"
                label="Quantity"
                type="number"
              />
            </IndexedFormSection>
          </form>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="buy-form" disabled={pending}>
            {pending
              ? "Placing order..."
              : `Place order — ${formatRM(priceSen * quantity)}`}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
