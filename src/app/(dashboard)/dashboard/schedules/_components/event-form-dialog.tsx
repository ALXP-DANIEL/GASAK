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
import { eventSchema, ORG_WIDE } from "@features/events/schema";
import { toDateTimeLocal } from "@lib/format";
import { EVENT_TYPE_LABELS } from "@lib/labels";
import { createEvent, updateEvent } from "@server/actions/events";
import { type Event, eventTypeEnum } from "@server/db/schema";
import type { z } from "zod";

type EventInput = z.infer<typeof eventSchema>;

const typeOptions = eventTypeEnum.enumValues.map((value) => ({
  value,
  label: EVENT_TYPE_LABELS[value],
}));

export function EventFormDialog({
  squads,
  allowOrgWide,
  event,
  trigger,
}: {
  squads: { value: string; label: string }[];
  allowOrgWide: boolean;
  event?: Event;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(event);

  const squadOptions = allowOrgWide
    ? [{ value: ORG_WIDE, label: "Organization-wide" }, ...squads]
    : squads;

  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<EventInput>({
      schema: eventSchema,
      defaultValues: {
        title: event?.title ?? "",
        description: event?.description ?? "",
        type: event?.type ?? "practice",
        startsAt: event ? toDateTimeLocal(event.startsAt) : "",
        endsAt: event?.endsAt ? toDateTimeLocal(event.endsAt) : "",
        location: event?.location ?? "",
        squadId: event?.squadId ?? squadOptions[0]?.value ?? "",
      },
      action: (values) => {
        const payload = {
          ...values,
          squadId: values.squadId === ORG_WIDE ? null : values.squadId,
        };
        return event ? updateEvent(event.id, payload) : createEvent(payload);
      },
      successMessage: isEdit ? "Event updated" : "Event created",
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {trigger ?? (
          <Button variant={isEdit ? "outline" : "default"}>
            {!isEdit && <Icons.Actions.Add />}
            {isEdit ? "Edit" : "Add event"}
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[85dvh] overflow-y-auto">
        <CredenzaHeader>
          <CredenzaTitle>{isEdit ? "Edit event" : "New event"}</CredenzaTitle>
          <CredenzaDescription>
            Schedule practice, scrims, meetings, or tournaments.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="title" label="Title" />
            <DashboardFormGrid>
              <FormSelect
                control={control}
                name="type"
                label="Type"
                options={typeOptions}
              />
              <FormSelect
                control={control}
                name="squadId"
                label="Squad"
                options={squadOptions}
                placeholder="Pick a squad"
              />
            </DashboardFormGrid>
            <DashboardFormGrid>
              <FormField
                control={control}
                name="startsAt"
                label="Starts"
                type="datetime-local"
              />
              <FormField
                control={control}
                name="endsAt"
                label="Ends"
                type="datetime-local"
              />
            </DashboardFormGrid>
            <FormField control={control} name="location" label="Location" />
            <FormField
              control={control}
              name="description"
              label="Description"
              as="textarea"
            />
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Saving..." : isEdit ? "Update event" : "Create event"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
