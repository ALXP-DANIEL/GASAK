"use client";

import { DashboardForm } from "@components/forms/dashboard-form";
import { FormField, FormSwitch } from "@components/forms/form-field";
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
import { createSquad } from "@server/actions/squads";
import { z } from "zod";

const squadFormSchema = z.object({
  name: z.string().min(2, "Squad name is required"),
  description: z.string().optional(),
  recruiting: z.boolean(),
});

type SquadFormInput = z.infer<typeof squadFormSchema>;

export function SquadFormDialog() {
  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<SquadFormInput>({
      schema: squadFormSchema,
      defaultValues: { name: "", description: "", recruiting: false },
      action: (values) => {
        const formData = new FormData();
        formData.set("name", values.name);
        if (values.description) formData.set("description", values.description);
        formData.set("recruiting", String(values.recruiting));
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
        <CredenzaBody className="grid gap-4">
          <DashboardForm onSubmit={handleSubmit}>
            <FormField control={control} name="name" label="Squad Name" />
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
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create Squad"}
            </Button>
          </DashboardForm>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
