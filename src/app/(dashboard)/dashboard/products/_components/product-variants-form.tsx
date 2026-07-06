"use client";

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
import { Field, FieldLabel } from "@components/ui/shadcn/field";
import { Input } from "@components/ui/shadcn/input";
import { Switch } from "@components/ui/shadcn/switch";
import { formatRM } from "@lib/format";
import { setProductVariants, uploadVariantImage } from "@server/actions/shop";
import type {
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@server/db/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

export type ProductWithVariants = Product & {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  variants: (ProductVariant & {
    optionValues: { optionValue: ProductOptionValue }[];
  })[];
};

type OptionDraft = { name: string; valuesText: string };

type VariantDraft = {
  price: string;
  stock: string;
  sku: string;
  imageUrl: string | null;
  active: boolean;
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

function buildInitialOptions(product: ProductWithVariants): OptionDraft[] {
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

function buildInitialDrafts(
  product: ProductWithVariants,
): Map<string, VariantDraft> {
  const map = new Map<string, VariantDraft>();
  for (const variant of product.variants) {
    const values = variant.optionValues.map((v) => v.optionValue.value);
    map.set(comboKey(values), {
      price: (variant.priceSen / 100).toFixed(2),
      stock: String(variant.stock),
      sku: variant.sku ?? "",
      imageUrl: variant.imageUrl,
      active: variant.active,
    });
  }
  return map;
}

export function ProductVariantsDialog({
  product,
}: {
  product: ProductWithVariants;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [options, setOptions] = useState<OptionDraft[]>(() =>
    buildInitialOptions(product),
  );
  const [drafts, setDrafts] = useState<Map<string, VariantDraft>>(() =>
    buildInitialDrafts(product),
  );

  const optionValueLists = useMemo(
    () => options.map((o) => parseValues(o.valuesText)),
    [options],
  );
  const combos = useMemo(() => {
    if (optionValueLists.some((list) => list.length === 0)) return [];
    return cartesian(optionValueLists);
  }, [optionValueLists]);

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    );
  }

  function addOption() {
    if (options.length >= 2) return;
    setOptions((prev) => [...prev, { name: "", valuesText: "" }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function draftFor(key: string): VariantDraft {
    return (
      drafts.get(key) ?? {
        price: "",
        stock: "0",
        sku: "",
        imageUrl: null,
        active: true,
      }
    );
  }

  function updateDraft(key: string, patch: Partial<VariantDraft>) {
    setDrafts((prev) => {
      const next = new Map(prev);
      next.set(key, { ...draftFor(key), ...patch });
      return next;
    });
  }

  function onSubmit() {
    for (const combo of combos) {
      const draft = draftFor(comboKey(combo));
      if (!draft.price || Number.isNaN(Number(draft.price))) {
        toast.error(`Set a price for ${combo.join(" / ")}`);
        return;
      }
    }

    startTransition(async () => {
      const result = await setProductVariants(product.id, {
        options: options
          .filter((o) => o.name.trim() && parseValues(o.valuesText).length)
          .map((o) => ({
            name: o.name.trim(),
            values: parseValues(o.valuesText),
          })),
        variants: combos.map((combo) => {
          const draft = draftFor(comboKey(combo));
          return {
            optionValues: combo,
            priceSen: Math.round(Number(draft.price) * 100),
            stock: Number(draft.stock) || 0,
            sku: draft.sku || null,
            imageUrl: draft.imageUrl,
            active: draft.active,
          };
        }),
      });

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
        <Button variant="outline" className="w-full">
          <Icons.Domain.Products />
          Manage variants
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Product variants</DialogTitle>
          <DialogDescription>
            Add up to 2 option types (e.g. Color, Size). Each combination
            becomes an orderable variant with its own price and stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {options.map((option, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: options are a short, position-stable list (max 2)
              key={index}
              className="grid grid-cols-[1fr_2fr_auto] items-end gap-2"
            >
              <Field>
                <FieldLabel>Option name</FieldLabel>
                <Input
                  value={option.name}
                  placeholder="e.g. Color"
                  onChange={(e) =>
                    updateOption(index, { name: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Values (comma separated)</FieldLabel>
                <Input
                  value={option.valuesText}
                  placeholder="e.g. Red, Blue, Green"
                  onChange={(e) =>
                    updateOption(index, { valuesText: e.target.value })
                  }
                />
              </Field>
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

          {options.length < 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={addOption}
            >
              <Icons.Actions.Add />
              Add option type
            </Button>
          )}

          {combos.length > 0 && (
            <div className="grid gap-2 overflow-x-auto rounded-md border border-input">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-input text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {options.map((o, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: options are a short, position-stable list (max 2)
                      <th key={i} className="p-2">
                        {o.name || `Option ${i + 1}`}
                      </th>
                    ))}
                    <th className="p-2">Price (RM)</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Image</th>
                    <th className="p-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo) => (
                    <VariantRow
                      key={comboKey(combo)}
                      combo={combo}
                      draft={draftFor(comboKey(combo))}
                      onChange={(patch) => updateDraft(comboKey(combo), patch)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button onClick={onSubmit} disabled={pending}>
            {pending ? "Saving..." : "Save variants"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantRow({
  combo,
  draft,
  onChange,
}: {
  combo: string[];
  draft: VariantDraft;
  onChange: (patch: Partial<VariantDraft>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();

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
      if (url) onChange({ imageUrl: url });
    });
  }

  return (
    <tr className="border-b border-input last:border-0">
      {combo.map((value) => (
        <td key={value} className="p-2 font-medium">
          {value}
        </td>
      ))}
      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={draft.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="w-24"
          placeholder={formatRM(0)}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          value={draft.stock}
          onChange={(e) => onChange({ stock: e.target.value })}
          className="w-20"
        />
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          {draft.imageUrl && (
            <Image
              src={draft.imageUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
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
            {uploading ? "…" : draft.imageUrl ? "Change" : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
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
        <Switch
          checked={draft.active}
          onCheckedChange={(active) => onChange({ active })}
        />
      </td>
    </tr>
  );
}
