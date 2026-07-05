"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { ROLE_LABELS } from "@/lib/labels";
import {
  createDashboardUser,
  removeDashboardUser,
  setDashboardUserRole,
} from "@/server/actions/users";
import { ROLES, type Role } from "@/server/db/schema";

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
  const [role, setRole] = useState<Role>("member");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createDashboardUser({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role,
      });

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
            Accounts for accepted players, leaders, and sellers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">Temporary password</Label>
            <Input id="new-password" name="password" type="text" required />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

  function setRole(userId: string, role: Role) {
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
                  onValueChange={(value) => setRole(user.id, value as Role)}
                  disabled={pending || user.id === currentUserId}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ROLE_LABELS[item]}
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
