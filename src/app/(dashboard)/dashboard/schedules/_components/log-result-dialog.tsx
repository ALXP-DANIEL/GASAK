"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import { FormField, FormSelect } from "@components/forms/form-field";
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
import { createTournamentRound } from "@features/tournaments/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { MATCH_OUTCOME_LABELS } from "@lib/labels";
import { createScrim } from "@server/actions/scrims";
import { matchOutcomeEnum } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const logResultSchema = z
  .object({
    mode: z.enum(["match", "round"]),
    squadId: z.string(),
    opponent: z.string().min(1, "Opponent is required"),
    result: z.string().optional(),
    notes: z.string().optional(),
    replayLink: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
    tournamentId: z.string(),
    roundLabel: z.string(),
    outcome: z.enum(matchOutcomeEnum.enumValues),
    score: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "match" && !values.squadId) {
      ctx.addIssue({
        code: "custom",
        path: ["squadId"],
        message: "Pick a squad",
      });
    }
    if (values.mode === "round") {
      if (!values.tournamentId) {
        ctx.addIssue({
          code: "custom",
          path: ["tournamentId"],
          message: "Pick a tournament",
        });
      }
      if (!values.roundLabel) {
        ctx.addIssue({
          code: "custom",
          path: ["roundLabel"],
          message: "Round label is required",
        });
      }
    }
  });

type LogResultInput = z.infer<typeof logResultSchema>;

const modeOptions = [
  { value: "match", label: "One-time match (scrim)" },
  { value: "round", label: "Tournament round" },
];

const outcomeOptions = matchOutcomeEnum.enumValues.map((value) => ({
  value,
  label: MATCH_OUTCOME_LABELS[value],
}));

export function LogResultDialog({
  event,
  squads,
  tournaments,
}: {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: string;
    squadId: string | null;
  };
  /** Squads the user manages — squad picker for the scrim record. */
  squads: { value: string; label: string }[];
  /** Tournaments the round can be attached to. */
  tournaments: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LogResultInput>({
    resolver: zodResolver(logResultSchema),
    defaultValues: {
      mode: event.type === "tournament" ? "round" : "match",
      squadId: event.squadId ?? squads[0]?.value ?? "",
      opponent: "",
      result: "",
      notes: "",
      replayLink: "",
      tournamentId: tournaments[0]?.value ?? "",
      roundLabel: "",
      outcome: "pending",
      score: "",
    },
  });

  const mode = form.watch("mode");

  function onSubmit(values: LogResultInput) {
    startTransition(async () => {
      const result =
        values.mode === "match"
          ? await createScrim({
              squadId: values.squadId,
              opponent: values.opponent,
              date: event.startsAt,
              result: values.result,
              notes: values.notes,
              replayLink: values.replayLink,
              eventId: event.id,
            })
          : await createTournamentRound(values.tournamentId, {
              roundLabel: values.roundLabel,
              opponent: values.opponent,
              scheduledAt: event.startsAt,
              outcome: values.outcome,
              score: values.score,
              notes: values.notes,
              replayLink: values.replayLink,
              eventId: event.id,
            });

      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }
      toast.success(result.message ?? "Result logged");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>Log result</Button>
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>Log result</CredenzaTitle>
          <CredenzaDescription>
            Record what happened at "{event.title}".
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={form.handleSubmit(onSubmit)}>
            <FormSelect
              control={form.control}
              name="mode"
              label="Record as"
              options={modeOptions}
            />

            {mode === "match" ? (
              <>
                <DashboardFormGrid>
                  <FormSelect
                    control={form.control}
                    name="squadId"
                    label="Squad"
                    options={squads}
                    placeholder="Pick a squad"
                  />
                  <FormField
                    control={form.control}
                    name="opponent"
                    label="Opponent"
                  />
                </DashboardFormGrid>
                <FormField
                  control={form.control}
                  name="result"
                  label="Result"
                  placeholder="e.g. 2-1 Win"
                />
              </>
            ) : (
              <>
                <FormSelect
                  control={form.control}
                  name="tournamentId"
                  label="Tournament"
                  options={tournaments}
                  placeholder="Pick a tournament"
                />
                <DashboardFormGrid>
                  <FormField
                    control={form.control}
                    name="roundLabel"
                    label="Round"
                    placeholder="e.g. Round 1, Semifinal"
                  />
                  <FormField
                    control={form.control}
                    name="opponent"
                    label="Opponent"
                  />
                </DashboardFormGrid>
                <DashboardFormGrid>
                  <FormSelect
                    control={form.control}
                    name="outcome"
                    label="Outcome"
                    options={outcomeOptions}
                  />
                  <FormField
                    control={form.control}
                    name="score"
                    label="Score"
                    placeholder="e.g. 2-1"
                  />
                </DashboardFormGrid>
              </>
            )}

            <FormField
              control={form.control}
              name="replayLink"
              label="Replay Link"
              type="url"
              placeholder="https://"
            />
            <FormField
              control={form.control}
              name="notes"
              label="Notes"
              as="textarea"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Log Result"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
