"use client";

import { FormField } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type OrderLookupValues = {
  orderNo: string;
};

export function OrderLookup() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<OrderLookupValues>({
    defaultValues: {
      orderNo: "",
    },
  });

  function onSubmit({ orderNo }: OrderLookupValues) {
    const normalizedOrderNo = orderNo.trim().toUpperCase();
    if (normalizedOrderNo) {
      router.push(`/shop/order/${normalizedOrderNo}`);
    }
  }

  return (
    <form
      className="flex w-full max-w-xs items-center gap-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        control={control}
        name="orderNo"
        label="Order number"
        hideLabel
        placeholder="Track order e.g. GSK-A1B2C3"
      />
      <Button type="submit" variant="outline">
        Track
      </Button>
    </form>
  );
}
