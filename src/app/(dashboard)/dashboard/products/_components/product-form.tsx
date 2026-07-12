"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import {
  FormCheckbox,
  FormField,
  FormFileInput,
  FormSelect,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import { createProduct, updateProduct } from "@server/actions/shop";
import { type Product, productCategoryEnum } from "@server/db/schema";
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
  const isEdit = Boolean(product);

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        name: product?.name ?? "",
        category: product?.category ?? "diamonds",
        description: product?.description ?? "",
        price: product ? Number((product.priceSen / 100).toFixed(2)) : 0,
        stock: product?.stock ?? 0,
        image: null,
        active: product?.active ?? true,
      },
      action: (values) => {
        const formData = new FormData();
        formData.set("name", values.name);
        formData.set("category", values.category);
        formData.set("description", values.description ?? "");
        formData.set("price", String(values.price));
        formData.set("stock", String(values.stock));
        formData.set("active", values.active ? "on" : "off");
        if (values.image) formData.set("image", values.image);
        return product
          ? updateProduct(product.id, formData)
          : createProduct(formData);
      },
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
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
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>
            {isEdit ? "Edit product" : "New product"}
          </CredenzaTitle>
          <CredenzaDescription>
            {isEdit
              ? "Update details, price, stock, and visibility."
              : "Add a product to the GASAK shop."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="name" label="Name" />
            <DashboardFormGrid>
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
                cropConfig={{
                  aspect: 1,
                  outputWidth: 1024,
                  outputHeight: 1024,
                }}
              />
            </DashboardFormGrid>
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
              {pending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create product"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
