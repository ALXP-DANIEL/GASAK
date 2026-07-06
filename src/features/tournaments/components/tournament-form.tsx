"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { Button } from "@components/ui/shadcn/button";
import {
  createTournament,
  updateTournament,
} from "@features/tournaments/actions";
import { tournamentSchema } from "@features/tournaments/schema";
import type { TournamentInput } from "@features/tournaments/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function TournamentForm({
  squads,
  tournamentId,
  defaultValues,
}: {
  squads: { value: string; label: string }[];
  tournamentId?: string;
  defaultValues?: Partial<TournamentInput>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(tournamentId);

  const form = useForm<TournamentInput>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      organizer: "",
      date: "",
      prize: "",
      opponent: "",
      result: "",
      mvp: "",
      squadId: squads[0]?.value ?? "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: TournamentInput) {
    setSubmitting(true);
    const result = tournamentId
      ? await updateTournament(tournamentId, values)
      : await createTournament(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(result.message ?? "Saved");
    router.push("/dashboard/tournaments");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid max-w-2xl gap-4"
    >
      <FormField control={form.control} name="name" label="Tournament Name" />
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormSelect
          control={form.control}
          name="squadId"
          label="Squad"
          options={squads}
          placeholder="Pick a squad"
        />
        <FormField
          control={form.control}
          name="date"
          label="Date"
          type="datetime-local"
        />
      </div>
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormField control={form.control} name="organizer" label="Organizer" />
        <FormField control={form.control} name="prize" label="Prize" />
      </div>
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormField control={form.control} name="opponent" label="Opponent" />
        <FormField
          control={form.control}
          name="result"
          label="Result"
          placeholder="e.g. Champion, 2-1 Win"
        />
      </div>
      <FormField control={form.control} name="mvp" label="MVP" />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : isEdit
              ? "Update Tournament"
              : "Record Tournament"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
