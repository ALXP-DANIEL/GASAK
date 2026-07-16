"use client";

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
import { RANK_TIER_OPTIONS, RANK_TIERS, type RankTier } from "@lib/ranks";
import {
  createJokiTier,
  type TierInput,
  updateJokiTier,
} from "@server/actions/joki";
import type { JokiTier } from "@server/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.enum(RANK_TIERS, "Pick a rank tier"),
  pricePerStar: z.number("Enter a price").positive("Enter a valid price in RM"),
  active: z.boolean(),
}) satisfies z.ZodType<TierInput>;

export function TierFormDialog({
  tier,
  configuredNames,
}: {
  tier?: JokiTier;
  /** Tier names already configured — excluded from the picker on create. */
  configuredNames?: string[];
}) {
  const isEdit = Boolean(tier);
  const taken = new Set(configuredNames ?? []);
  const nameOptions = RANK_TIER_OPTIONS.filter(
    (o) => o.value === tier?.name || !taken.has(o.value),
  );

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<TierInput>({
      schema,
      defaultValues: {
        name:
          (tier?.name as RankTier | undefined) ??
          nameOptions[0]?.value ??
          RANK_TIERS[0],
        pricePerStar: tier
          ? Number((tier.pricePerStarSen / 100).toFixed(2))
          : 0,
        active: tier?.active ?? true,
      },
      action: (values) =>
        tier ? updateJokiTier(tier.id, values) : createJokiTier(values),
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button disabled={nameOptions.length === 0}>
            <Icons.Actions.Add />
            New tier
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit tier" : "New tier"}</CredenzaTitle>
          <CredenzaDescription>
            A rank tier's per-star boosting rate, e.g. "Epic" at RM2/⭐.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form id="tier-form" onSubmit={handleSubmit} className="grid gap-5">
            <FormSection title="Tier">
              <FormSelect
                control={control}
                name="name"
                label="Rank tier"
                options={nameOptions}
              />
              <FormField
                control={control}
                name="pricePerStar"
                label="Price per star (RM)"
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
          <Button type="submit" form="tier-form" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create tier"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
