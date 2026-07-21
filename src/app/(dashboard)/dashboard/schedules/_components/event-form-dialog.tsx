"use client";

import { DashboardFormGrid } from "@components/forms/dashboard-form";
import {
  FormDatePicker,
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
import { eventSchema, ORG_WIDE } from "@features/events/schema";
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

  const { open, setOpen, control, pending, handleSubmit, form } =
    useEntityDialog<EventInput>({
      schema: eventSchema,
      defaultValues: {
        title: event?.title ?? "",
        description: event?.description ?? "",
        type: event?.type ?? "practice",
        date: event?.date ?? "",
        prizePool: event?.prizePool ?? "",
        location: event?.location ?? "",
        squadId: event?.squadId ?? "",
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

  const type = form.watch("type");

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
        <CredenzaBody>
          <form id="event-form" onSubmit={handleSubmit} className="grid gap-5">
            <FormSection title="Event Details">
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
              <FormDatePicker control={control} name="date" label="Date" />
              {type === "tournament" && (
                <FormField
                  control={control}
                  name="prizePool"
                  label="Prize Pool"
                  placeholder="e.g. RM500 + trophies"
                />
              )}
              <FormField control={control} name="location" label="Location" />
              <FormField
                control={control}
                name="description"
                label="Description"
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
          <Button type="submit" form="event-form" disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Update event" : "Create event"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
