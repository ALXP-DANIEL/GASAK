"use client";

import {
  FormCheckbox,
  FormField,
  FormFileInput,
  FormSelect,
  FormSwitch,
} from "@components/forms/form-field";
import { IndexedFormSection } from "@components/forms/form-section";
import { TagInput } from "@components/forms/tag-input";
import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatRM } from "@lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@lib/labels";
import {
  createProduct,
  setProductVariants,
  updateProduct,
  uploadVariantImage,
} from "@server/actions/shop";
import {
  type Product,
  type ProductCategory,
  type ProductOption,
  type ProductOptionValue,
  type ProductVariant,
  productCategoryEnum,
} from "@server/db/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export type ProductWithVariants = Product & {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  variants: (ProductVariant & {
    optionValues: { optionValue: ProductOptionValue }[];
  })[];
};

const categoryOptions = productCategoryEnum.enumValues.map((item) => ({
  value: item,
  label: PRODUCT_CATEGORY_LABELS[item],
}));

// Number inputs report "" when cleared, so accept it here and enforce real
// numbers conditionally in superRefine — hidden fields (the simple price when
// variants are on, variant rows when they're off) must never block submit.
const numberOrEmpty = z.union([z.number(), z.literal("")]);

const optionDraftSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
});

const variantDraftSchema = z.object({
  comboKey: z.string(),
  optionValues: z.array(z.string()),
  price: numberOrEmpty,
  stock: numberOrEmpty,
  sku: z.string(),
  imageUrl: z.string().nullable(),
  active: z.boolean(),
});

const schema = z
  .object({
    name: z.string().min(2, "Product name is required"),
    category: z.enum(productCategoryEnum.enumValues),
    description: z.string().optional(),
    image: z.instanceof(File).nullable(),
    active: z.boolean(),
    hasVariants: z.boolean(),
    price: numberOrEmpty.optional(),
    stock: numberOrEmpty.optional(),
    options: z.array(optionDraftSchema).max(2, "Up to 2 option types"),
    variants: z.array(variantDraftSchema),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVariants) {
      if (typeof data.price !== "number" || data.price <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Enter a valid price",
        });
      }
      if (
        typeof data.stock !== "number" ||
        !Number.isInteger(data.stock) ||
        data.stock < 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["stock"],
          message: "Enter a valid stock count",
        });
      }
      return;
    }

    const seenNames = new Set<string>();
    data.options.forEach((option, i) => {
      const name = option.name.trim().toLowerCase();
      if (!name) {
        ctx.addIssue({
          code: "custom",
          path: ["options", i, "name"],
          message: "Name this option (e.g. Size)",
        });
      } else if (seenNames.has(name)) {
        ctx.addIssue({
          code: "custom",
          path: ["options", i, "name"],
          message: "Option names must be unique",
        });
      }
      seenNames.add(name);
      if (option.values.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["options", i, "values"],
          message: "Add at least one value",
        });
      }
    });

    data.variants.forEach((variant, i) => {
      if (typeof variant.price !== "number" || variant.price <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "price"],
          message: "Enter a valid price",
        });
      }
      if (
        typeof variant.stock !== "number" ||
        !Number.isInteger(variant.stock) ||
        variant.stock < 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "stock"],
          message: "Enter a valid stock count",
        });
      }
    });
  });

type Values = z.infer<typeof schema>;

function comboKey(values: string[]) {
  return values.join("||");
}

function cartesian(lists: string[][]): string[][] {
  return lists.reduce<string[][]>(
    (acc, list) => acc.flatMap((combo) => list.map((v) => [...combo, v])),
    [[]],
  );
}

function buildDefaults(
  product: ProductWithVariants | undefined,
  fixedCategory?: ProductCategory,
): Values {
  const options = product
    ? [...product.options]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({
          name: option.name,
          values: [...option.values]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((v) => v.value),
        }))
    : [];

  const variants = product
    ? product.variants.map((variant) => {
        const optionValues = variant.optionValues.map(
          (v) => v.optionValue.value,
        );
        return {
          comboKey: comboKey(optionValues),
          optionValues,
          price: Number((variant.priceSen / 100).toFixed(2)),
          stock: variant.stock,
          sku: variant.sku ?? "",
          imageUrl: variant.imageUrl,
          active: variant.active,
        };
      })
    : [];

  return {
    name: product?.name ?? "",
    category: product?.category ?? fixedCategory ?? "merchandise",
    description: product?.description ?? "",
    image: null,
    active: product?.active ?? true,
    hasVariants: product?.hasVariants ?? false,
    price: product ? Number((product.priceSen / 100).toFixed(2)) : undefined,
    stock: product?.stock,
    options,
    variants,
  };
}

export function ProductFormPage({
  product,
  fixedCategory,
}: {
  product?: ProductWithVariants;
  fixedCategory?: ProductCategory;
}) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(product, fixedCategory),
  });
  const { control, handleSubmit } = form;

  const hasVariants = useWatch({ control, name: "hasVariants" });
  const optionsWatch = useWatch({ control, name: "options" });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variants",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when option values change; form/variantFields are read fresh each run
  useEffect(() => {
    if (!hasVariants) return;
    const lists = optionsWatch.map((o) => o.values.filter(Boolean));
    const combos =
      lists.length === 0 || lists.some((list) => list.length === 0)
        ? []
        : cartesian(lists);

    const currentByKey = new Map(
      form.getValues("variants").map((v) => [v.comboKey, v]),
    );
    const next = combos.map((combo) => {
      const key = comboKey(combo);
      return (
        currentByKey.get(key) ?? {
          comboKey: key,
          optionValues: combo,
          price: 0,
          stock: 0,
          sku: "",
          imageUrl: null,
          active: true,
        }
      );
    });

    const unchanged =
      next.length === variantFields.length &&
      next.every((n, i) => n.comboKey === variantFields[i].comboKey);
    if (!unchanged) replaceVariants(next);
  }, [optionsWatch, hasVariants]);

  function onSubmit(values: Values) {
    if (values.hasVariants && values.variants.length === 0) {
      toast.error("Add at least one option with values");
      return;
    }

    startTransition(async () => {
      // "" is impossible past superRefine, but narrow it for TypeScript.
      const variantPrices = values.variants.map((v) => Number(v.price || 0));
      const variantStocks = values.variants.map((v) => Number(v.stock || 0));
      const rollupPrice = values.hasVariants
        ? Math.min(...variantPrices)
        : Number(values.price || 0);
      const rollupStock = values.hasVariants
        ? variantStocks.reduce((sum, n) => sum + n, 0)
        : Number(values.stock || 0);

      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("category", values.category);
      formData.set("description", values.description ?? "");
      formData.set("price", String(rollupPrice));
      formData.set("stock", String(rollupStock));
      formData.set("active", values.active ? "on" : "off");
      if (values.image) formData.set("image", values.image);

      const result = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const productId = product?.id ?? result.data?.productId;

      if (productId) {
        const variantsResult = await setProductVariants(productId, {
          options: values.hasVariants
            ? values.options.map((o) => ({ name: o.name, values: o.values }))
            : [],
          variants: values.hasVariants
            ? values.variants.map((v, i) => ({
                optionValues: v.optionValues,
                priceSen: Math.round(variantPrices[i] * 100),
                stock: variantStocks[i],
                sku: v.sku || null,
                imageUrl: v.imageUrl,
                active: v.active,
              }))
            : [],
        });
        if (!variantsResult.ok) {
          toast.error(variantsResult.error);
          return;
        }
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      router.push(
        values.category === "merchandise"
          ? "/dashboard/products/merchandise"
          : "/dashboard/products",
      );
      router.refresh();
    });
  }

  function onInvalid() {
    toast.error("Fix the highlighted fields before saving");
  }

  return (
    <div className="border bg-card">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-0">
        <IndexedFormSection
          index="01"
          title="Basic info"
          description="What shoppers see as the product name and description."
        >
          <div className="grid gap-4">
            <FormField control={control} name="name" label="Name" />
            <FormField
              control={control}
              name="description"
              label="Description"
              as="textarea"
              rows={3}
            />
          </div>
        </IndexedFormSection>

        {!fixedCategory && (
          <IndexedFormSection
            index="02"
            title="Category"
            description="Which shop section this product appears under."
          >
            <FormSelect
              control={control}
              name="category"
              label="Category"
              options={categoryOptions}
            />
          </IndexedFormSection>
        )}

        <IndexedFormSection
          index={fixedCategory ? "02" : "03"}
          title="Media"
          description="Shown on the shop listing card and product page."
        >
          <FormFileInput
            control={control}
            name="image"
            label={`Image ${product?.imageUrl ? "(replace)" : ""}`}
            accept="image/*"
            cropConfig={{ aspect: 1, outputWidth: 1024, outputHeight: 1024 }}
          />
        </IndexedFormSection>

        <IndexedFormSection
          index={fixedCategory ? "03" : "04"}
          title="Options & variants"
          description="Turn on for products with choices like size or color — each combination gets its own price, stock, and image."
        >
          <div className="grid gap-4">
            <FormSwitch
              control={control}
              name="hasVariants"
              label="This product has multiple options"
            />

            {hasVariants && (
              <>
                {optionFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_2fr_auto] items-end gap-2"
                  >
                    <FormField
                      control={control}
                      name={`options.${index}.name`}
                      label="Option name"
                      placeholder="e.g. Size"
                    />
                    <TagInput
                      control={control}
                      name={`options.${index}.values`}
                      label="Values"
                      placeholder="Type a value, press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Icons.Actions.Delete />
                    </Button>
                  </div>
                ))}

                {optionFields.length < 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => appendOption({ name: "", values: [] })}
                  >
                    <Icons.Actions.Add />
                    Add option type
                  </Button>
                )}

                {variantFields.length > 0 && (
                  <div className="grid gap-2 overflow-x-auto rounded-md border border-input">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-input text-left text-xs uppercase tracking-wider text-muted-foreground">
                          {optionFields.map((field, i) => (
                            <th key={field.id} className="p-2">
                              {optionsWatch[i]?.name || `Option ${i + 1}`}
                            </th>
                          ))}
                          <th className="p-2">Price (RM)</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Image</th>
                          <th className="p-2">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantFields.map((field, index) => (
                          <VariantRow
                            key={field.id}
                            control={control}
                            index={index}
                            optionValues={field.optionValues}
                            onImageUploaded={(url) =>
                              form.setValue(`variants.${index}.imageUrl`, url)
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {!hasVariants && (
              <div className="grid gap-4 desktop:grid-cols-2">
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
              </div>
            )}
          </div>
        </IndexedFormSection>

        <IndexedFormSection
          index={fixedCategory ? "04" : "05"}
          title="Visibility"
          description="Controls whether this shows up in the public shop."
        >
          <FormCheckbox
            control={control}
            name="active"
            label="Visible in the public shop"
          />
        </IndexedFormSection>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/10 p-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function VariantRow({
  control,
  index,
  optionValues,
  onImageUploaded,
}: {
  control: Control<Values>;
  index: number;
  optionValues: string[];
  onImageUploaded: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const imageUrl = useWatch({ control, name: `variants.${index}.imageUrl` });

  function handleFile(file: File) {
    const formData = new FormData();
    formData.set("image", file);
    startUpload(async () => {
      const result = await uploadVariantImage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const url = result.data?.url;
      if (url) onImageUploaded(url);
    });
  }

  return (
    <tr className="border-b border-input last:border-0">
      {optionValues.map((value) => (
        <td key={value} className="p-2 font-medium">
          {value}
        </td>
      ))}
      <td className="w-24 p-2">
        <FormField
          control={control}
          name={`variants.${index}.price`}
          label="Variant price"
          hideLabel
          type="number"
          placeholder={formatRM(0)}
        />
      </td>
      <td className="w-20 p-2">
        <FormField
          control={control}
          name={`variants.${index}.stock`}
          label="Variant stock"
          hideLabel
          type="number"
        />
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded object-cover"
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "…" : imageUrl ? "Change" : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Upload variant image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleFile(file);
            }}
          />
        </div>
      </td>
      <td className="p-2">
        <FormSwitch
          control={control}
          name={`variants.${index}.active`}
          label="Variant active"
          hideLabel
        />
      </td>
    </tr>
  );
}
