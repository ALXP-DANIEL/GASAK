"use client";

import { EmailAliasField } from "@components/forms/email-alias-field";
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

const EMAIL_DOMAIN = "gasak.com";

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
    <Diawer open={open} onOpenChange={setOpen}>
      <DiawerTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New user
        </Button>
      </DiawerTrigger>
      <DiawerContent>
        <DiawerHeader>
          <DiawerTitle>Create user</DiawerTitle>
          <DiawerDescription>
            Accounts for admins, sellers, and regular users. Squad leaders are
            assigned via squad membership, not here.
          </DiawerDescription>
        </DiawerHeader>
        <DiawerBody className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
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
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create user"}
            </Button>
          </form>
        </DiawerBody>
      </DiawerContent>
    </Diawer>
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
    <Diawer open={open} onOpenChange={setOpen}>
      <DiawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${user.name}`}>
          <Icons.Actions.Edit />
        </Button>
      </DiawerTrigger>
      <DiawerContent>
        <DiawerHeader>
          <DiawerTitle>Edit user</DiawerTitle>
          <DiawerDescription>Update name and email.</DiawerDescription>
        </DiawerHeader>
        <DiawerBody className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FormField control={control} name="name" label="Name" />
            <FormField
              control={control}
              name="email"
              label="Email"
              type="email"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DiawerBody>
      </DiawerContent>
    </Diawer>
  );
}
