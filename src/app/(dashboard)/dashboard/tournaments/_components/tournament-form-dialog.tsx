"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import {
  FormDateTimeField,
  FormField,
  FormSelect,
  formFieldStyles,
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
import { Field, FieldLabel } from "@components/ui/shadcn/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import {
  createTournament,
  updateTournament,
} from "@features/tournaments/actions";
import { tournamentSchema } from "@features/tournaments/schema";
import type { TournamentInput } from "@features/tournaments/types";
import { toDateTimeLocal } from "@lib/format";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@lib/labels";
import { cn } from "@lib/utils";
import {
  type Tournament,
  tournamentFormatEnum,
  tournamentStatusEnum,
} from "@server/db/schema";
import { useState } from "react";

const trackingOptions = [
  { value: "manual", label: "Manual — I'll log rounds myself" },
  { value: "challonge", label: "Tracked by Challonge" },
];

const formatOptions = tournamentFormatEnum.enumValues.map((value) => ({
  value,
  label: TOURNAMENT_FORMAT_LABELS[value],
}));

const statusOptions = tournamentStatusEnum.enumValues.map((value) => ({
  value,
  label: TOURNAMENT_STATUS_LABELS[value],
}));

export function TournamentFormDialog({
  squads,
  tournament,
}: {
  squads: { value: string; label: string }[];
  tournament?: Tournament;
}) {
  const isEdit = Boolean(tournament);
  const [tracking, setTracking] = useState<"manual" | "challonge">("manual");

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<TournamentInput>({
      schema: tournamentSchema,
      defaultValues: {
        name: tournament?.name ?? "",
        organizer: tournament?.organizer ?? "",
        date: tournament ? toDateTimeLocal(tournament.date) : "",
        prize: tournament?.prize ?? "",
        placement: tournament?.placement ?? "",
        mvp: tournament?.mvp ?? "",
        format: tournament?.format ?? "single_elimination",
        status: tournament?.status ?? "upcoming",
        challongeUrl: tournament?.challongeUrl ?? "",
        squadId: tournament?.squadId ?? "",
      },
      action: (values) =>
        tournament
          ? updateTournament(tournament.id, values)
          : createTournament({ ...values, tracking }),
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {isEdit ? (
          <Button variant="outline">Edit</Button>
        ) : (
          <Button>
            <Icons.Actions.Add />
            New Tournament
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>
            {isEdit ? "Edit tournament" : "New tournament"}
          </CredenzaTitle>
          <CredenzaDescription>
            Track a tournament run for one of your squads.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="tournament-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection title="Tournament Details">
              <FormField
                control={control}
                name="name"
                label="Tournament Name"
              />
              <DashboardFormGrid>
                <FormSelect
                  control={control}
                  name="squadId"
                  label="Squad"
                  options={squads}
                  placeholder="Pick a squad"
                />
                <FormDateTimeField control={control} name="date" label="Date" />
              </DashboardFormGrid>
              <DashboardFormGrid>
                <FormSelect
                  control={control}
                  name="format"
                  label="Format"
                  options={formatOptions}
                />
                <FormSelect
                  control={control}
                  name="status"
                  label="Status"
                  options={statusOptions}
                />
              </DashboardFormGrid>
            </FormSection>

            <FormSection title="Results">
              <DashboardFormGrid>
                <FormField
                  control={control}
                  name="organizer"
                  label="Organizer"
                />
                <FormField control={control} name="prize" label="Prize" />
              </DashboardFormGrid>
              <DashboardFormGrid>
                <FormField
                  control={control}
                  name="placement"
                  label="Placement"
                  placeholder="e.g. Champion, Top 4"
                />
                <FormField control={control} name="mvp" label="MVP" />
              </DashboardFormGrid>
            </FormSection>

            {!isEdit && (
              <FormSection title="Tracking">
                <Field className={formFieldStyles.fieldShell}>
                  <FieldLabel className={formFieldStyles.label}>
                    Tracking
                  </FieldLabel>
                  <Select
                    value={tracking}
                    onValueChange={(value) =>
                      setTracking(value as typeof tracking)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        formFieldStyles.control,
                        "w-full data-[size=default]:h-10",
                      )}
                    >
                      <SelectValue>
                        {(value: string) =>
                          trackingOptions.find(
                            (option) => option.value === value,
                          )?.label ?? value
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {trackingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {tracking === "challonge" && (
                  <FormField
                    control={control}
                    name="challongeUrl"
                    label="Challonge URL"
                    type="url"
                    placeholder="https://challonge.com/..."
                    description="You'll pick which participant is your squad and sync rounds after creating the tournament."
                  />
                )}
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
          <Button type="submit" form="tournament-form" disabled={pending}>
            {pending
              ? "Saving..."
              : isEdit
                ? "Update Tournament"
                : "Create Tournament"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
