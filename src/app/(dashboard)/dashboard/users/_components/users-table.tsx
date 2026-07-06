"use client";

import { FormField, FormSelect } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import { Badge } from "@components/ui/shadcn/badge";
import { Button } from "@components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/shadcn/dialog";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { ORG_ROLE_LABELS } from "@lib/labels";
import {
  createDashboardUser,
  removeDashboardUser,
  setDashboardUserRole,
} from "@server/actions/users";
import { ORG_ROLES, type OrgRole } from "@server/db/schema";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const roleOptions = ORG_ROLES.map((item) => ({
  value: item,
  label: ORG_ROLE_LABELS[item],
}));

const createUserFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { control, handleSubmit } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "user" },
  });

  function onSubmit(values: CreateUserFormValues) {
    startTransition(async () => {
      const result = await createDashboardUser(values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.Actions.Add />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Accounts for admins, sellers, and regular users. Squad leaders are
            assigned via squad membership, not here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormField control={control} name="name" label="Name" />
          <FormField
            control={control}
            name="email"
            label="Email"
            type="email"
          />
          <FormField
            control={control}
            name="password"
            label="Temporary password"
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
      </DialogContent>
    </Dialog>
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
              <TableCell className="text-right">
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
