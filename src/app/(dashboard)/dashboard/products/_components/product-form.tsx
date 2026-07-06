"use client";

import {
  FormCheckbox,
  FormField,
  FormFileInput,
  FormSelect,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
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
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createProduct, updateProduct } from "@server/actions/shop";
import { type Product, productCategoryEnum } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const categoryOptions = productCategoryEnum.enumValues.map((item) => ({
  value: item,
  label: PRODUCT_CATEGORY_LABELS[item],
}));

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.enum(productCategoryEnum.enumValues),
  description: z.string().optional(),
  price: z.number("Enter a price").positive("Enter a valid price in RM"),
  stock: z
    .number("Enter a stock count")
    .int()
    .min(0, "Enter a valid stock count"),
  image: z.instanceof(File).nullable(),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function ProductFormDialog({ product }: { product?: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(product);

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "diamonds",
      description: product?.description ?? "",
      price: product ? Number((product.priceSen / 100).toFixed(2)) : 0,
      stock: product?.stock ?? 0,
      image: null,
      active: product?.active ?? true,
    },
  });

  function onSubmit(values: Values) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("category", values.category);
    formData.set("description", values.description ?? "");
    formData.set("price", String(values.price));
    formData.set("stock", String(values.stock));
    formData.set("active", values.active ? "on" : "off");
    if (values.image) formData.set("image", values.image);

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Icons.Actions.Add />
            New product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details, price, stock, and visibility."
              : "Add a product to the GASAK shop."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="name" label="Name" />
          <div className="grid gap-4 desktop:grid-cols-2">
            <FormSelect
              control={control}
              name="category"
              label="Category"
              options={categoryOptions}
            />
            <FormField
              control={control}
              name="price"
              label="Price (RM)"
              type="number"
            />
            <FormField
              control={control}
              name="stock"
              label="Stock"
              type="number"
            />
            <FormFileInput
              control={control}
              name="image"
              label={`Image ${product?.imageUrl ? "(replace)" : ""}`}
              accept="image/*"
            />
          </div>
          <FormField
            control={control}
            name="description"
            label="Description"
            as="textarea"
            rows={3}
          />
          <FormCheckbox
            control={control}
            name="active"
            label="Visible in the public shop"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
