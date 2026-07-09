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
  createTournament,
  updateTournament,
} from "@features/tournaments/actions";
import { tournamentSchema } from "@features/tournaments/schema";
import type { TournamentInput } from "@features/tournaments/types";
import { toDateTimeLocal } from "@lib/format";
import type { Tournament } from "@server/db/schema";

export function TournamentFormDialog({
  squads,
  tournament,
}: {
  squads: { value: string; label: string }[];
  tournament?: Tournament;
}) {
  const isEdit = Boolean(tournament);

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<TournamentInput>({
      schema: tournamentSchema,
      defaultValues: {
        name: tournament?.name ?? "",
        organizer: tournament?.organizer ?? "",
        date: tournament ? toDateTimeLocal(tournament.date) : "",
        prize: tournament?.prize ?? "",
        opponent: tournament?.opponent ?? "",
        result: tournament?.result ?? "",
        mvp: tournament?.mvp ?? "",
        squadId: tournament?.squadId ?? squads[0]?.value ?? "",
      },
      action: (values) =>
        tournament
          ? updateTournament(tournament.id, values)
          : createTournament(values),
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
            Record a tournament for one of your squads.
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
              <FormField control={control} name="organizer" label="Organizer" />
              <FormField control={control} name="prize" label="Prize" />
            </DashboardFormGrid>
            <DashboardFormGrid>
              <FormField control={control} name="opponent" label="Opponent" />
              <FormField
                control={control}
                name="result"
                label="Result"
                placeholder="e.g. Champion, 2-1 Win"
              />
            </DashboardFormGrid>
            <FormField control={control} name="mvp" label="MVP" />
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : isEdit
                  ? "Update Tournament"
                  : "Record Tournament"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
