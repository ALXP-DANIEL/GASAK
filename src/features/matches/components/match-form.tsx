"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormField, FormSelect } from "@/components/forms/form-field";
import { Button } from "@/components/ui/shadcn/button";
import { matchSchema } from "@/features/matches/schema";
import { createScrim } from "@/server/actions/records";

type MatchInput = z.infer<typeof matchSchema>;

export function MatchForm({
  teams,
}: {
  teams: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MatchInput>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      squadId: teams[0]?.value ?? "",
      opponent: "",
      date: "",
      result: "",
      notes: "",
      replayLink: "",
    },
  });

  async function onSubmit(values: MatchInput) {
    setSubmitting(true);
    const result = await createScrim(values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(result.message ?? "Match recorded");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormSelect
          control={form.control}
          name="squadId"
          label="Squad"
          options={teams}
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
        <FormField control={form.control} name="opponent" label="Opponent" />
        <FormField
          control={form.control}
          name="result"
          label="Result"
          placeholder="e.g. 2-1 Win"
        />
      </div>
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
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving..." : "Record Match"}
      </Button>
    </form>
  );
}
