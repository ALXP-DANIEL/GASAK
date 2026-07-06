"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { MlbbIdFields } from "@components/forms/mlbb-id-fields";
import { BrandCard } from "@components/ui/brand";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { LANE_LABELS, MLBB_RANKS } from "@lib/labels";
import { submitApplication } from "@server/actions/public";
import { laneEnum } from "@server/db/schema";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  ign: z.string().min(1, "IGN is required"),
  mlbbId: z.string().min(4, "Enter a valid MLBB ID"),
  serverId: z.string().min(1, "Server ID is required"),
  squadId: z.string().optional(),
  currentRank: z.string().min(1, "Select your current rank"),
  preferredLane: z.enum(laneEnum.enumValues, "Select your preferred lane"),
  heroPool: z.string().min(2, "List a few of your best heroes"),
  previousTeam: z.string().optional(),
  introduction: z.string().min(10, "Tell us a bit about yourself"),
});

type Values = z.infer<typeof schema>;

const ANY_SQUAD_VALUE = "any";

const rankOptions = MLBB_RANKS.map((rank) => ({ value: rank, label: rank }));
const laneOptions = laneEnum.enumValues.map((lane) => ({
  value: lane,
  label: LANE_LABELS[lane],
}));

export function ApplicationForm({
  squads = [],
}: {
  squads?: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      ign: "",
      mlbbId: "",
      serverId: "",
      squadId: ANY_SQUAD_VALUE,
      currentRank: "",
      heroPool: "",
      previousTeam: "",
      introduction: "",
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await submitApplication({
        ...values,
        squadId:
          values.squadId && values.squadId !== ANY_SQUAD_VALUE
            ? values.squadId
            : undefined,
      });
      if (result.ok) {
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <BrandCard className="p-6">
        <h2 className="font-heading text-2xl font-bold tracking-wide">
          Application received
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for applying to GASAK. Our admins will review your application
          and reach out by email or WhatsApp.
        </p>
      </BrandCard>
    );
  }

  return (
    <BrandCard className="p-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-wide">
          Application form
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All fields are required unless marked optional.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-4 desktop:grid-cols-2">
          <FormField control={control} name="fullName" label="Full name" />
          <FormField
            control={control}
            name="email"
            label="Email"
            type="email"
          />
          <FormField
            control={control}
            name="phone"
            label="Phone (WhatsApp)"
            placeholder="+60…"
          />
          <FormField control={control} name="ign" label="In-game name (IGN)" />
          <MlbbIdFields
            control={control}
            mlbbIdName="mlbbId"
            serverIdName="serverId"
          />
          <FormSelect
            control={control}
            name="currentRank"
            label="Current rank"
            options={rankOptions}
            placeholder="Select rank"
          />
          <FormSelect
            control={control}
            name="preferredLane"
            label="Preferred lane"
            options={laneOptions}
            placeholder="Select lane"
          />
          {squads.length > 0 && (
            <FormSelect
              control={control}
              name="squadId"
              label="Preferred squad (optional)"
              options={[
                { value: ANY_SQUAD_VALUE, label: "No preference" },
                ...squads.map((squad) => ({
                  value: squad.id,
                  label: squad.name,
                })),
              ]}
              placeholder="No preference"
              description="Only squads currently open for recruitment are listed."
            />
          )}
        </div>
        <FormField
          control={control}
          name="heroPool"
          label="Hero pool"
          placeholder="e.g. Ling, Fanny, Lancelot, Hayabusa"
        />
        <FormField
          control={control}
          name="previousTeam"
          label="Previous team (optional)"
        />
        <FormField
          control={control}
          name="introduction"
          label="Short introduction"
          as="textarea"
          rows={4}
          placeholder="Playstyle, availability, goals…"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </BrandCard>
  );
}
