"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import { FormField, FormSelect } from "@components/forms/form-field";
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
import {
  createTournamentRound,
  updateTournamentRound,
} from "@features/tournaments/actions";
import { tournamentRoundSchema } from "@features/tournaments/schema";
import { toDateTimeLocal } from "@lib/format";
import { MATCH_OUTCOME_LABELS } from "@lib/labels";
import { matchOutcomeEnum, type TournamentRound } from "@server/db/schema";
import { z } from "zod";

/** Sentinel for "no linked schedule event" in the select. */
const NO_EVENT = "none";

const roundFormSchema = tournamentRoundSchema
  .omit({ eventId: true })
  .extend({ eventId: z.string() });

type RoundFormInput = z.infer<typeof roundFormSchema>;

const outcomeOptions = matchOutcomeEnum.enumValues.map((value) => ({
  value,
  label: MATCH_OUTCOME_LABELS[value],
}));

export function RoundFormDialog({
  tournamentId,
  round,
  events,
  trigger,
}: {
  tournamentId: string;
  round?: TournamentRound;
  /** Schedule events the round can link to (the squad's events). */
  events: { value: string; label: string }[];
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(round);
  const eventOptions = [
    { value: NO_EVENT, label: "No linked event" },
    ...events,
  ];

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<RoundFormInput>({
      schema: roundFormSchema,
      defaultValues: {
        roundLabel: round?.roundLabel ?? "",
        opponent: round?.opponent ?? "",
        scheduledAt: round?.scheduledAt
          ? toDateTimeLocal(round.scheduledAt)
          : "",
        outcome: round?.outcome ?? "pending",
        score: round?.score ?? "",
        notes: round?.notes ?? "",
        replayLink: round?.replayLink ?? "",
        eventId: round?.eventId ?? NO_EVENT,
      },
      action: (values) => {
        const payload = {
          ...values,
          eventId: values.eventId === NO_EVENT ? null : values.eventId,
        };
        return round
          ? updateTournamentRound(round.id, payload)
          : createTournamentRound(tournamentId, payload);
      },
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={isEdit ? "ghost" : "default"}>
            {!isEdit && <Icons.Actions.Add />}
            {isEdit ? "Edit" : "Add Round"}
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit round" : "Add round"}</CredenzaTitle>
          <CredenzaDescription>
            Log a round of this tournament — who you faced and how it went.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <DashboardFormGrid>
              <FormField
                control={control}
                name="roundLabel"
                label="Round"
                placeholder="e.g. Round 1, Semifinal"
              />
              <FormField control={control} name="opponent" label="Opponent" />
            </DashboardFormGrid>
            <DashboardFormGrid>
              <FormSelect
                control={control}
                name="outcome"
                label="Outcome"
                options={outcomeOptions}
              />
              <FormField
                control={control}
                name="score"
                label="Score"
                placeholder="e.g. 2-1"
              />
            </DashboardFormGrid>
            <DashboardFormGrid>
              <FormField
                control={control}
                name="scheduledAt"
                label="Played At"
                type="datetime-local"
              />
              <FormSelect
                control={control}
                name="eventId"
                label="Schedule Event"
                options={eventOptions}
              />
            </DashboardFormGrid>
            <FormField
              control={control}
              name="replayLink"
              label="Replay Link"
              type="url"
              placeholder="https://"
            />
            <FormField
              control={control}
              name="notes"
              label="Notes"
              as="textarea"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Update Round" : "Add Round"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
