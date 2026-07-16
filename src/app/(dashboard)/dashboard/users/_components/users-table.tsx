"use client";

import { EmailAliasField } from "@components/forms/email-alias-field";
import { FormField, FormSelect } from "@components/forms/form-field";
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
import { ORG_ROLE_LABELS } from "@lib/labels";
import {
  createDashboardUser,
  updateDashboardUser,
} from "@server/actions/users";
import { ORG_ROLES } from "@server/db/schema";
import { z } from "zod";
import type { UserRow } from "./user-row-actions";

const roleOptions = ORG_ROLES.map((item) => ({
  value: item,
  label: ORG_ROLE_LABELS[item],
}));

const EMAIL_DOMAIN = "gasak.my";

const createUserFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  emailAlias: z
    .string()
    .min(1, "Email is required")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Only letters, numbers, dots, underscores, and hyphens",
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ORG_ROLES),
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export function CreateUserDialog() {
  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<CreateUserFormValues>({
      schema: createUserFormSchema,
      defaultValues: { name: "", emailAlias: "", password: "", role: "user" },
      action: (values) =>
        createDashboardUser({
          name: values.name,
          email: `${values.emailAlias}@${EMAIL_DOMAIN}`,
          password: values.password,
          role: values.role,
        }),
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New user
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Create user</CredenzaTitle>
          <CredenzaDescription>
            Accounts for admins, sellers, and regular users. Squad leaders are
            assigned via squad membership, not here.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="create-user-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormSection title="Account">
              <FormField control={control} name="name" label="Name" />
              <EmailAliasField
                control={control}
                name="emailAlias"
                label="Email"
                domain={EMAIL_DOMAIN}
              />
              <FormField
                control={control}
                name="password"
                label="Temporary password"
                description="The user must set a new password the first time they log in."
              />
              <FormSelect
                control={control}
                name="role"
                label="Role"
                options={roleOptions}
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
          <Button type="submit" form="create-user-form" disabled={pending}>
            {pending ? "Creating..." : "Create user"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}

const editUserFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export function EditUserDialog({ user }: { user: UserRow }) {
  const { open, setOpen, control, pending, handleSubmit } =
    useEntityDialog<EditUserFormValues>({
      schema: editUserFormSchema,
      defaultValues: { name: user.name, email: user.email },
      action: (values) => updateDashboardUser({ userId: user.id, ...values }),
    });

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${user.name}`}>
          <Icons.Actions.Edit />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Edit user</CredenzaTitle>
          <CredenzaDescription>Update name and email.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            id="edit-user-form"
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <FormField control={control} name="name" label="Name" />
            <FormField
              control={control}
              name="email"
              label="Email"
              type="email"
            />
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
          <Button type="submit" form="edit-user-form" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
