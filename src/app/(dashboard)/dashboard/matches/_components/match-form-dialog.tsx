"use client";

import {
  DashboardForm,
  DashboardFormGrid,
} from "@components/forms/dashboard-form";
import { FormField, FormSelect } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { useEntityDialog } from "@components/shared/use-entity-dialog";
import {
  Diawer,
  DiawerBody,
  DiawerContent,
  DiawerDescription,
  DiawerHeader,
  DiawerTitle,
  DiawerTrigger,
} from "@components/ui/diawer";
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
    <Diawer open={open} onOpenChange={setOpen}>
      <DiawerTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          Record Match
        </Button>
      </DiawerTrigger>
      <DiawerContent>
        <DiawerHeader>
          <DiawerTitle>Record match</DiawerTitle>
          <DiawerDescription>
            Log a scrim or match result for your squad.
          </DiawerDescription>
        </DiawerHeader>
        <DiawerBody className="grid gap-4">
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
        </DiawerBody>
      </DiawerContent>
    </Diawer>
  );
}
