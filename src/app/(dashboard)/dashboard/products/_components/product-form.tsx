"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels";
import { createProduct, updateProduct } from "@/server/actions/shop";
import {
  type Product,
  type ProductCategory,
  productCategoryEnum,
} from "@/server/db/schema";

export function ProductFormDialog({ product }: { product?: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? "diamonds",
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(product);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("category", category);
    formData.set("active", active ? "on" : "off");

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
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
            />
          </div>
          <div className="grid gap-4 desktop:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as ProductCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productCategoryEnum.enumValues.map((item) => (
                    <SelectItem key={item} value={item}>
                      {PRODUCT_CATEGORY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (RM)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={
                  product ? (product.priceSen / 100).toFixed(2) : undefined
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={product?.stock}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">
                Image {product?.imageUrl ? "(replace)" : ""}
              </Label>
              <Input id="image" name="image" type="file" accept="image/*" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={active}
              onCheckedChange={(checked) => setActive(checked === true)}
            />
            <Label htmlFor="active">Visible in the public shop</Label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
