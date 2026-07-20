"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import {
  FormDateTimeField,
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
        squadId: "",
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
        <CredenzaBody>
          <form id="match-form" onSubmit={handleSubmit} className="grid gap-5">
            <FormSection title="Match">
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
                <FormField control={control} name="opponent" label="Opponent" />
                <FormField
                  control={control}
                  name="result"
                  label="Result"
                  placeholder="e.g. 2-1 Win"
                />
              </DashboardFormGrid>
            </FormSection>
            <FormSection title="Notes">
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
          <Button type="submit" form="match-form" disabled={pending}>
            {pending ? "Saving..." : "Record Match"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
