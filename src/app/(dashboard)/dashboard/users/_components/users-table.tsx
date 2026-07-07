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
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/shadcn/table";
import { ORG_ROLE_LABELS } from "@lib/labels";
import {
  createDashboardUser,
  removeDashboardUser,
  setDashboardUserRole,
  updateDashboardUser,
} from "@server/actions/users";
import { ORG_ROLES, type OrgRole } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";

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

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  ign: string | null;
  banned: boolean;
};

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

function EditUserDialog({ user }: { user: UserRow }) {
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

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setRole(userId: string, role: OrgRole) {
    startTransition(async () => {
      const result = await setDashboardUserRole({
        userId,
        role,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function removeUser(userId: string, name: string) {
    if (!window.confirm(`Delete ${name}'s account? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeDashboardUser(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-none border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden desktop:table-cell">IGN</TableHead>
            <TableHead>Role</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className="font-medium">
                  {user.name}
                  {user.id === currentUserId && (
                    <Badge variant="secondary" className="ml-2">
                      You
                    </Badge>
                  )}
                  {user.banned && (
                    <Badge variant="destructive" className="ml-2">
                      Banned
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </TableCell>
              <TableCell className="hidden desktop:table-cell">
                {user.ign ?? "-"}
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => setRole(user.id, value as OrgRole)}
                  disabled={pending || user.id === currentUserId}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ORG_ROLE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="flex justify-end gap-1 text-right">
                <EditUserDialog user={user} />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending || user.id === currentUserId}
                  onClick={() => removeUser(user.id, user.name)}
                  aria-label={`Delete ${user.name}`}
                >
                  <Icons.Actions.Delete className="text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
