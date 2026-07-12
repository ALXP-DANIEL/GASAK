"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import {
  FormField,
  FormSelect,
  formFieldStyles,
} from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
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
        squadId: tournament?.squadId ?? squads[0]?.value ?? "",
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
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="name" label="Tournament Name" />
            <DashboardFormGrid>
              <FormSelect
                control={control}
                name="squadId"
                label="Squad"
                options={squads}
                placeholder="Pick a squad"
              />
              <FormField
                control={control}
                name="date"
                label="Date"
                type="datetime-local"
              />
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
            <DashboardFormGrid>
              <FormField control={control} name="organizer" label="Organizer" />
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
            {!isEdit && (
              <>
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
                      className={`${formFieldStyles.control} w-full`}
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
              </>
            )}
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : isEdit
                  ? "Update Tournament"
                  : "Create Tournament"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
