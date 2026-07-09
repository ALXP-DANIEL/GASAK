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
import { matchSchema } from "@features/matches/schema";
import { createScrim } from "@server/actions/scrims";
import type { z } from "zod";

type MatchInput = z.infer<typeof matchSchema>;

export function MatchFormDialog({
  squads,
}: {
  squads: { value: string; label: string }[];
}) {
  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<MatchInput>({
      schema: matchSchema,
      defaultValues: {
        squadId: squads[0]?.value ?? "",
        opponent: "",
        date: "",
        result: "",
        notes: "",
        replayLink: "",
      },
      action: (values) => createScrim(values),
      successMessage: "Match recorded",
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          Record Match
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Record match</CredenzaTitle>
          <CredenzaDescription>
            Log a scrim or match result for your squad.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
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
              <FormField control={control} name="opponent" label="Opponent" />
              <FormField
                control={control}
                name="result"
                label="Result"
                placeholder="e.g. 2-1 Win"
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
              {pending ? "Saving..." : "Record Match"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
