"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { LaneSelectGroup } from "@components/forms/lane-select-group";
import { MlbbIdFields } from "@components/forms/mlbb-id-fields";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import { RankSelect } from "@components/forms/rank-select";
import { BrandCard } from "@components/ui/brand";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { rankFieldSchema } from "@lib/ranks";
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
  currentRank: rankFieldSchema,
  preferredLanes: z
    .array(z.enum(laneEnum.enumValues))
    .min(1, "Select at least one lane"),
  heroPool: z.string().min(2, "List a few of your best heroes"),
  previousTeam: z.string().optional(),
  introduction: z.string().min(10, "Tell us a bit about yourself"),
});

type Values = z.infer<typeof schema>;

const ANY_SQUAD_VALUE = "any";

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
      currentRank: undefined,
      preferredLanes: [],
      heroPool: "",
      previousTeam: "",
      introduction: "",
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await submitApplication({
        ...values,
        phone: toMalaysiaPhone(values.phone),
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
      <BrandCard className="border-primary/40 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Submitted
        </p>
        <h2 className="mt-3 font-heading text-2xl font-bold uppercase tracking-wide">
          Application received
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Thanks for applying to GASAK. Our admins will review your application
          and reach out by email or WhatsApp.
        </p>
      </BrandCard>
    );
  }

  return (
    <BrandCard className="overflow-hidden">
      <div className="border-b border-primary/20 bg-primary/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Application form
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-wide">
          Player trial request
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Fill in your contact details, MLBB profile, and trial preference. Use
          accurate information so recruiters can review your application faster.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-0">
        <FormSection
          index="01"
          title="Contact"
          description="How the recruitment team should reach you."
        >
          <div className="grid gap-4 desktop:grid-cols-2">
            <FormField control={control} name="fullName" label="Full name" />
            <FormField
              control={control}
              name="email"
              label="Email"
              type="email"
            />
            <PhonePrefixField
              control={control}
              name="phone"
              label="Phone (WhatsApp)"
            />
          </div>
        </FormSection>

        <FormSection
          index="02"
          title="MLBB profile"
          description="Your in-game identity and current competitive level."
        >
          <div className="grid gap-4 desktop:grid-cols-2">
            <FormField
              control={control}
              name="ign"
              label="In-game name (IGN)"
            />
            <MlbbIdFields
              control={control}
              mlbbIdName="mlbbId"
              serverIdName="serverId"
            />
            <RankSelect
              control={control}
              name="currentRank"
              label="Current rank"
              description="Pick your tier, division, and stars (e.g. Legend V · 3★)."
            />
            <FormSelect
              control={control}
              name="squadId"
              label="Preferred squad (optional)"
              options={[
                {
                  value: ANY_SQUAD_VALUE,
                  label: "No specific squad request",
                },
                ...squads.map((squad) => ({
                  value: squad.id,
                  label: squad.name,
                })),
              ]}
              placeholder="No specific squad request"
              description={
                squads.length > 0
                  ? "Only squads currently open for recruitment are listed."
                  : "No squad is currently open for direct requests."
              }
            />
          </div>
        </FormSection>

        <FormSection
          index="03"
          title="Trial role"
          description="The lanes and heroes you want recruiters to evaluate."
        >
          <div className="grid gap-5">
            <LaneSelectGroup
              control={control}
              name="preferredLanes"
              label="Preferred lanes"
              description="Pick the lanes you want to trial for, or Flex for any role."
            />
            <FormField
              control={control}
              name="heroPool"
              label="Hero pool"
              placeholder="e.g. Ling, Fanny, Lancelot, Hayabusa"
            />
          </div>
        </FormSection>

        <FormSection
          index="04"
          title="Background"
          description="Short context that helps the team understand your fit."
        >
          <div className="grid gap-4">
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
          </div>
        </FormSection>

        <div className="flex flex-col gap-3 border-t border-primary/20 bg-muted/10 p-6 desktop:flex-row desktop:items-center desktop:justify-between">
          <p className="max-w-xl text-xs leading-6 text-muted-foreground">
            By submitting, you confirm that the contact and game details are
            accurate for recruitment review.
          </p>
          <Button type="submit" disabled={pending} className="desktop:w-fit">
            {pending ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </form>
    </BrandCard>
  );
}

function FormSection({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-border p-6 first:border-t-0 desktop:grid-cols-[10rem_minmax(0,1fr)]">
      <div>
        <p className="font-mono text-xs text-primary">{index}</p>
        <h3 className="mt-2 font-heading text-xl font-bold uppercase tracking-wide">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function toMalaysiaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");
  return `+60${digits}`;
}
