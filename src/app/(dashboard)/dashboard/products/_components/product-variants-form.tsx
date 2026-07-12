"use client";

import { FormField, FormSwitch } from "@components/forms/form-field";
import { FormSection } from "@components/forms/form-section";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
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
import { formatRM } from "@lib/format";
import { setProductVariants, uploadVariantImage } from "@server/actions/shop";
import type {
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@server/db/schema";
import Image from "next/image";
import { useEffect, useRef, useTransition } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export type ProductWithVariants = Product & {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  variants: (ProductVariant & {
    optionValues: { optionValue: ProductOptionValue }[];
  })[];
};

function parseValues(text: string) {
  return Array.from(
    new Set(
      text
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );
}

function cartesian(lists: string[][]): string[][] {
  return lists.reduce<string[][]>(
    (acc, list) => acc.flatMap((combo) => list.map((v) => [...combo, v])),
    [[]],
  );
}

function comboKey(values: string[]) {
  return values.join("||");
}

const optionDraftSchema = z.object({
  name: z.string(),
  valuesText: z.string(),
});

const variantDraftSchema = z.object({
  comboKey: z.string(),
  optionValues: z.array(z.string()),
  price: z.string().min(1, "Price is required"),
  stock: z.string(),
  sku: z.string(),
  imageUrl: z.string().nullable(),
  active: z.boolean(),
});

const schema = z.object({
  options: z
    .array(optionDraftSchema)
    .max(2, "Up to 2 option types are supported"),
  variants: z.array(variantDraftSchema),
});

type Values = z.infer<typeof schema>;

function buildInitialOptions(product: ProductWithVariants): Values["options"] {
  return [...product.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((option) => ({
      name: option.name,
      valuesText: [...option.values]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((v) => v.value)
        .join(", "),
    }));
}

function buildInitialVariants(
  product: ProductWithVariants,
): Values["variants"] {
  return product.variants.map((variant) => {
    const optionValues = variant.optionValues.map((v) => v.optionValue.value);
    return {
      comboKey: comboKey(optionValues),
      optionValues,
      price: (variant.priceSen / 100).toFixed(2),
      stock: String(variant.stock),
      sku: variant.sku ?? "",
      imageUrl: variant.imageUrl,
      active: variant.active,
    };
  });
}

export function ProductVariantsDialog({
  product,
}: {
  product: ProductWithVariants;
}) {
  const { open, setOpen, control, pending, handleSubmit, form } =
    useEntityDialog<Values>({
      schema,
      defaultValues: {
        options: buildInitialOptions(product),
        variants: buildInitialVariants(product),
      },
      action: (values) => {
        const validCombos = new Set(values.variants.map((v) => v.comboKey));
        return setProductVariants(product.id, {
          options: values.options
            .filter((o) => o.name.trim() && parseValues(o.valuesText).length)
            .map((o) => ({
              name: o.name.trim(),
              values: parseValues(o.valuesText),
            })),
          variants: values.variants
            .filter((v) => validCombos.has(v.comboKey))
            .map((v) => ({
              optionValues: v.optionValues,
              priceSen: Math.round(Number(v.price) * 100),
              stock: Number(v.stock) || 0,
              sku: v.sku || null,
              imageUrl: v.imageUrl,
              active: v.active,
            })),
        });
      },
    });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variants",
  });

  const optionsWatch = useWatch({ control, name: "options" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-sync when option values change; form/variantFields are read fresh each run
  useEffect(() => {
    const lists = optionsWatch.map((o) => parseValues(o.valuesText));
    const combos = lists.some((list) => list.length === 0)
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
          price: "",
          stock: "0",
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
  }, [optionsWatch]);

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="outline" className="w-full">
          <Icons.Domain.Products />
          Manage variants
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className="max-w-3xl">
        <CredenzaHeader>
          <CredenzaTitle>Product variants</CredenzaTitle>
          <CredenzaDescription>
            Add up to 2 option types (e.g. Color, Size). Each combination
            becomes an orderable variant with its own price and stock.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="product-variants-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection
              title="Option Types"
              description="Up to 2 option types (e.g. Color, Size)."
            >
              {optionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_2fr_auto] items-end gap-2"
                >
                  <FormField
                    control={control}
                    name={`options.${index}.name`}
                    label="Option name"
                    placeholder="e.g. Color"
                  />
                  <FormField
                    control={control}
                    name={`options.${index}.valuesText`}
                    label="Values (comma separated)"
                    placeholder="e.g. Red, Blue, Green"
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
                  onClick={() => appendOption({ name: "", valuesText: "" })}
                >
                  <Icons.Actions.Add />
                  Add option type
                </Button>
              )}
            </FormSection>

            {variantFields.length > 0 && (
              <FormSection
                title="Variants"
                description="Each combination becomes an orderable variant with its own price and stock."
              >
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
              </FormSection>
            )}
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
          <Button type="submit" form="product-variants-form" disabled={pending}>
            {pending ? "Saving..." : "Save variants"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
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
