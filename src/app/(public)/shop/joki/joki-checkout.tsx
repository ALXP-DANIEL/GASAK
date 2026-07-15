"use client";

import { FormField } from "@components/forms/form-field";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import { RankSelect } from "@components/forms/rank-select";
import { BrandCard } from "@components/ui/brand";
import { Button } from "@components/ui/shadcn/button";
import { Separator } from "@components/ui/shadcn/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatRM } from "@lib/format";
import {
  computeJokiPackagePath,
  computeJokiStarPath,
  resolveJokiTier,
  sortJokiTiers,
} from "@lib/joki";
import { toMalaysiaPhone } from "@lib/phone";
import { rankFieldSchema } from "@lib/ranks";
import { placeJokiOrder } from "@server/actions/public";
import type { JokiPackage, JokiTier } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const jokiFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(6, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  mlbbId: z.string().min(4, "Enter a valid MLBB ID"),
  serverId: z.string().min(1, "Server ID is required"),
  fromRank: rankFieldSchema.nullable().optional(),
  toRank: rankFieldSchema.nullable().optional(),
});

type JokiFormValues = z.infer<typeof jokiFormSchema>;
type JokiMode = "per_star" | "package";

export function JokiCheckout({
  tiers,
  packages,
  mode,
}: {
  tiers: JokiTier[];
  packages: JokiPackage[];
  /** Fixed pricing mode — each pricing mode gets its own page, no in-place toggle. */
  mode: JokiMode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const orderedActiveTiers = sortJokiTiers(tiers);
  const coverageLabel =
    orderedActiveTiers.length > 0
      ? `Boosting covers ${orderedActiveTiers[0].name} to ${
          orderedActiveTiers[orderedActiveTiers.length - 1].name
        }.`
      : "No tiers configured yet.";

  const { control, handleSubmit } = useForm<JokiFormValues>({
    resolver: zodResolver(jokiFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      mlbbId: "",
      serverId: "",
      fromRank: null,
      toRank: null,
    },
  });

  const [fromRank, toRank] = useWatch({
    control,
    name: ["fromRank", "toRank"],
  });

  const starPath =
    fromRank && toRank ? computeJokiStarPath(tiers, fromRank, toRank) : null;
  const fromTier = resolveJokiTier(tiers, fromRank);
  const toTier = resolveJokiTier(tiers, toRank);
  const packagePath =
    fromTier && toTier
      ? computeJokiPackagePath(tiers, packages, fromTier.id, toTier.id)
      : null;
  const totalSen =
    mode === "per_star"
      ? (starPath?.totalSen ?? 0)
      : (packagePath?.totalSen ?? 0);

  function onSubmit(values: JokiFormValues) {
    if (!values.fromRank || !values.toRank) {
      toast.error("Pick your current and target rank");
      return;
    }
    startTransition(async () => {
      const result = await placeJokiOrder({
        customerName: values.customerName,
        customerPhone: toMalaysiaPhone(values.customerPhone),
        customerEmail: values.customerEmail,
        mlbbId: values.mlbbId,
        serverId: values.serverId,
        mode,
        // biome-ignore lint/style/noNonNullAssertion: validated above
        fromRank: values.fromRank!,
        // biome-ignore lint/style/noNonNullAssertion: validated above
        toRank: values.toRank!,
      });

      if (result.ok && result.data?.orderNo) {
        toast.success("Joki order placed! Complete your payment.");
        router.push(`/shop/order/${result.data.orderNo}`);
        return;
      }
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <BrandCard interactive={false} className="p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 desktop:grid-cols-2"
      >
        <RankSelect
          control={control}
          name="fromRank"
          label="Current rank"
          description={
            mode === "package"
              ? "Package pricing only cares about the tier."
              : coverageLabel
          }
          tierOnly={mode === "package"}
        />
        <RankSelect
          control={control}
          name="toRank"
          label="Target rank"
          description={
            mode === "package"
              ? "Package pricing only cares about the tier."
              : "Where you want to land."
          }
          tierOnly={mode === "package"}
          tierHint="Select the rank you want to reach."
        />

        <div className="rounded-md border border-border/70 bg-card/70 px-4 py-3 text-sm desktop:col-span-2">
          {mode === "per_star" ? (
            starPath ? (
              <div className="flex flex-col gap-1">
                {starPath.legs.map((leg) => (
                  <div
                    key={leg.tierName}
                    className="flex items-center justify-between text-muted-foreground"
                  >
                    <span>
                      {leg.tierName} × {leg.stars}⭐
                    </span>
                    <span>{formatRM(leg.priceSen)}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1 font-medium text-foreground">
                  <span>{starPath.totalStars} stars total</span>
                  <span>{formatRM(starPath.totalSen)}</span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {fromRank && toRank
                  ? "Pick a valid range — target must be above your current rank, within the configured tiers."
                  : "Pick your current and target rank — stars and price are calculated automatically."}
              </span>
            )
          ) : packagePath ? (
            <div className="flex flex-col gap-1">
              {packagePath.legs.map((leg) => (
                <div
                  key={leg.name}
                  className="flex items-center justify-between text-muted-foreground"
                >
                  <span>{leg.name}</span>
                  <span>{formatRM(leg.priceSen)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">
              {fromRank && toRank
                ? "No package covers that exact range — try per-star pricing."
                : "Pick your current and target rank to see the price."}
            </span>
          )}
        </div>

        <div className="desktop:col-span-2">
          <Separator />
        </div>

        <FormField control={control} name="mlbbId" label="MLBB ID" />
        <FormField control={control} name="serverId" label="Server ID" />
        <FormField control={control} name="customerName" label="Name" />
        <PhonePrefixField
          control={control}
          name="customerPhone"
          label="Phone (WhatsApp)"
        />
        <div className="desktop:col-span-2">
          <FormField
            control={control}
            name="customerEmail"
            label="Email"
            type="email"
          />
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 desktop:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <span className="font-heading text-2xl font-bold text-primary">
              {formatRM(totalSen)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Deposit now (50%) — balance after boost done</span>
            <span className="font-semibold">
              {formatRM(Math.ceil(totalSen / 2))}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending || totalSen <= 0}
          className="font-semibold uppercase tracking-wider desktop:col-span-2"
        >
          {pending
            ? "Placing order..."
            : `Place order — ${formatRM(Math.ceil(totalSen / 2))} deposit`}
        </Button>
      </form>
    </BrandCard>
  );
}
