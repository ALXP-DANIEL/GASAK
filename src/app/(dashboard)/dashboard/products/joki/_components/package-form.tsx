"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import {
  FormCheckbox,
  FormField,
  FormSelect,
} from "@components/forms/form-field";
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
import { sortJokiTiers } from "@lib/joki";
import {
  createJokiPackage,
  type PackageInput,
  updateJokiPackage,
} from "@server/actions/joki";
import type { JokiPackage, JokiTier } from "@server/db/schema";
import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Package name is required"),
  fromTierId: z.uuid("Pick the starting tier"),
  toTierId: z.uuid("Pick the target tier"),
  price: z.number("Enter a price").positive("Enter a valid price in RM"),
  active: z.boolean(),
}) satisfies z.ZodType<PackageInput>;

const pairKey = (fromTierId: string, toTierId: string) =>
  `${fromTierId}:${toTierId}`;

export function PackageFormDialog({
  pkg,
  tiers,
  packages,
}: {
  pkg?: JokiPackage;
  tiers: JokiTier[];
  /** All existing packages — used to block re-adding an already-covered range. */
  packages: JokiPackage[];
}) {
  const isEdit = Boolean(pkg);
  const orderedTiers = sortJokiTiers(tiers);
  const tierIndex = new Map(orderedTiers.map((t, i) => [t.id, i]));

  // Every forward tier-pair already covered by another package (excluding
  // this package's own pair, so editing it doesn't lock itself out).
  const takenPairs = new Set(
    packages
      .filter((p) => p.id !== pkg?.id && p.fromTierId && p.toTierId)
      .map((p) => pairKey(p.fromTierId as string, p.toTierId as string)),
  );

  const totalForwardPairs =
    (orderedTiers.length * (orderedTiers.length - 1)) / 2;
  const allPairsTaken = !isEdit && takenPairs.size >= totalForwardPairs;

  const { open, setOpen, control, pending, handleSubmit, form } =
    useEntityDialog<PackageInput>({
      schema,
      defaultValues: {
        name: pkg?.name ?? "",
        fromTierId: pkg?.fromTierId ?? orderedTiers[0]?.id ?? "",
        toTierId: pkg?.toTierId ?? orderedTiers[1]?.id ?? "",
        price: pkg ? Number((pkg.priceSen / 100).toFixed(2)) : 0,
        active: pkg?.active ?? true,
      },
      action: (values) =>
        pkg ? updateJokiPackage(pkg.id, values) : createJokiPackage(values),
    });

  const fromTierId = useWatch({ control, name: "fromTierId" });

  const fromOptions = orderedTiers.map((t) => ({ value: t.id, label: t.name }));
  const toOptions = orderedTiers
    .filter((t) => {
      const fromIdx = tierIndex.get(fromTierId);
      const toIdx = tierIndex.get(t.id);
      if (fromIdx === undefined || toIdx === undefined || toIdx <= fromIdx) {
        return false;
      }
      return !takenPairs.has(pairKey(fromTierId, t.id));
    })
    .map((t) => ({ value: t.id, label: t.name }));

  // Keep "To tier" valid whenever "From tier" changes and the previous
  // selection no longer clears the hierarchy/duplicate-pair filter above.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-check when the from-tier selection changes; form/toOptions are read fresh each run
  useEffect(() => {
    const toTierId = form.getValues("toTierId");
    if (toOptions.some((o) => o.value === toTierId)) return;
    form.setValue("toTierId", toOptions[0]?.value ?? "", {
      shouldValidate: true,
    });
  }, [fromTierId]);

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button disabled={allPairsTaken}>
            <Icons.Actions.Add />
            {allPairsTaken ? "All ranges covered" : "New package"}
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {isEdit ? "Edit package" : "New package"}
          </CredenzaTitle>
          <CredenzaDescription>
            A flat-rate boost between two tiers, e.g. "Epic → Legend" for RM15.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="package-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection title="Package">
              <FormField control={control} name="name" label="Name" />
              <DashboardFormGrid>
                <FormSelect
                  control={control}
                  name="fromTierId"
                  label="From tier"
                  options={fromOptions}
                />
                <FormSelect
                  control={control}
                  name="toTierId"
                  label="To tier"
                  options={toOptions}
                  description={
                    toOptions.length === 0
                      ? "Every range from this tier is already covered."
                      : undefined
                  }
                />
              </DashboardFormGrid>
              <FormField
                control={control}
                name="price"
                label="Price (RM)"
                type="number"
              />
              <FormCheckbox
                control={control}
                name="active"
                label="Shown on the public pricelist"
              />
            </FormSection>
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
          <Button
            type="submit"
            form="package-form"
            disabled={pending || toOptions.length === 0}
          >
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create package"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
