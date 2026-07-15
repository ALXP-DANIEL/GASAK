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
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Package name is required"),
  fromTierId: z.uuid("Pick the starting tier"),
  toTierId: z.uuid("Pick the target tier"),
  price: z.number("Enter a price").positive("Enter a valid price in RM"),
  active: z.boolean(),
}) satisfies z.ZodType<PackageInput>;

export function PackageFormDialog({
  pkg,
  tiers,
}: {
  pkg?: JokiPackage;
  tiers: JokiTier[];
}) {
  const isEdit = Boolean(pkg);
  const orderedTiers = sortJokiTiers(tiers);
  const tierOptions = orderedTiers.map((t) => ({ value: t.id, label: t.name }));

  const { open, setOpen, control, pending, handleSubmit } =
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
            New package
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
                  options={tierOptions}
                />
                <FormSelect
                  control={control}
                  name="toTierId"
                  label="To tier"
                  options={tierOptions}
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
          <Button type="submit" form="package-form" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create package"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
