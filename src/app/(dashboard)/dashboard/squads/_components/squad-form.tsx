"use client";

import { FormField, FormSwitch } from "@components/forms/form-field";
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
import { SQUAD_DIVISION_SLUGS } from "@lib/labels";
import { createSquad } from "@server/actions/squads";
import { Controller } from "react-hook-form";
import { z } from "zod";
import { DivisionPicker } from "./division-picker";

const squadFormSchema = z.object({
  name: z.string().min(2, "Squad name is required"),
  description: z.string().optional(),
  recruiting: z.boolean(),
  division: z.enum(SQUAD_DIVISION_SLUGS),
});

type SquadFormInput = z.infer<typeof squadFormSchema>;

const FORM_ID = "squad-create-form";

export function SquadFormDialog({
  lockedDivision,
}: {
  /** When the list is filtered to a division, new squads are created in it. */
  lockedDivision?: SquadFormInput["division"];
}) {
  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<SquadFormInput>({
      schema: squadFormSchema,
      defaultValues: {
        name: "",
        description: "",
        recruiting: false,
        division: lockedDivision ?? "gasak",
      },
      action: (values) => {
        const formData = new FormData();
        formData.set("name", values.name);
        if (values.description) formData.set("description", values.description);
        formData.set("recruiting", String(values.recruiting));
        formData.set("division", values.division);
        return createSquad(formData);
      },
      successMessage: "Squad created",
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New squad
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Create squad</CredenzaTitle>
          <CredenzaDescription>
            Add a new squad to the organization.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form id={FORM_ID} onSubmit={handleSubmit} className="grid gap-5">
            <FormSection title="Squad Details">
              <FormField control={control} name="name" label="Squad Name" />
              <Controller
                control={control}
                name="division"
                render={({ field }) => (
                  <DivisionPicker
                    value={field.value}
                    onChange={field.onChange}
                    locked={Boolean(lockedDivision)}
                  />
                )}
              />
              <FormField
                control={control}
                name="description"
                label="Description"
                as="textarea"
              />
              <FormSwitch
                control={control}
                name="recruiting"
                label="Open for recruitment"
                description="Show this squad as an optional choice on the public recruitment form."
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
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? "Creating..." : "Create Squad"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
