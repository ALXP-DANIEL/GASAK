"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField, FormSelect } from "@/components/forms/form-field";
import { Button } from "@/components/ui/shadcn/button";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { createEvent } from "@/server/actions/events";
import { eventTypeEnum } from "@/server/db/schema";

const ORG_WIDE = "org";

const eventFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  type: z.enum(eventTypeEnum.enumValues),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  squadId: z.string(),
});

type EventFormInput = z.infer<typeof eventFormSchema>;

export function EventForm({
  squads,
  allowOrgWide,
  onSuccess,
}: {
  squads: { value: string; label: string }[];
  allowOrgWide: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const squadOptions = allowOrgWide
    ? [{ value: ORG_WIDE, label: "Organization-wide" }, ...squads]
    : squads;

  const typeOptions = eventTypeEnum.enumValues.map((value) => ({
    value,
    label: EVENT_TYPE_LABELS[value],
  }));

  const form = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "practice",
      startsAt: "",
      endsAt: "",
      location: "",
      squadId: squadOptions[0]?.value ?? "",
    },
  });

  async function onSubmit(values: EventFormInput) {
    setSubmitting(true);
    const result = await createEvent({
      ...values,
      squadId: values.squadId === ORG_WIDE ? null : values.squadId,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(result.message ?? "Event created");
    form.reset();
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <FormField control={form.control} name="title" label="Title" />
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormSelect
          control={form.control}
          name="type"
          label="Type"
          options={typeOptions}
        />
        <FormSelect
          control={form.control}
          name="squadId"
          label="Squad"
          options={squadOptions}
          placeholder="Pick a squad"
        />
      </div>
      <div className="grid gap-4 desktop:grid-cols-2">
        <FormField
          control={form.control}
          name="startsAt"
          label="Starts"
          type="datetime-local"
        />
        <FormField
          control={form.control}
          name="endsAt"
          label="Ends"
          type="datetime-local"
        />
      </div>
      <FormField control={form.control} name="location" label="Location" />
      <FormField
        control={form.control}
        name="description"
        label="Description"
        as="textarea"
      />
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
}
